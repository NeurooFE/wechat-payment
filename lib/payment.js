const { URL } = require('url')
const wechatPay = require('wechat-pay')
const fs = require('fs')
const path = require('path')

module.exports = (app, config) => {
  // 设置模板
  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'ejs')

  const Payment = wechatPay.Payment
  const payMiddleware = wechatPay.middleware
  const { partnerKey, appId, mchId, notifyUrl, pfx, spbillCreateIp, tradeType } = config.payment
  // 微信支付config
  const initConfig = {
    partnerKey,
    appId,
    mchId,
    notifyUrl,
    pfx
  }
  const payment = new Payment(initConfig) 
  // 解释回调地址，分解出回调路径和域名
  const wechatNotifyUrl = new URL(notifyUrl)
  const wechatPayCallbackPath = wechatNotifyUrl.pathname
  const origin = wechatNotifyUrl.origin
  /**
   * 获取订单支付配置
   * @param body {string} 支付标题
   * @param openId {string} openid
   * @param orderNo {string} 订单编号
   * @param price {number} 价格，以分为单位
   */
  const getPayconfig = ({body, openId, orderNo, price}) => {
    return new Promise(function (resolve, reject) {
      const order = {
        body,
        out_trade_no: orderNo,
        total_fee: price,
        spbill_create_ip: spbillCreateIp,
        openid: openId,
        trade_type: tradeType
      }
      
      payment.getBrandWCPayRequestParams(order, function (err, payargs) {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(payargs)
        }
      })
    })
  }
  
  /**
   * 格式化微信回传的时间格式
   * @param date {number}
   * @return {string} 返回如 '2017/08/08 12:12:12' 的时间格式，方便调用new Date()
   */
  const formatWxDate = (date) => {
    return date.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1/$2/$3 $4:$5:$6')
  }
  /**
   * 支付路径
   */
  app.get(config.payPath, async (req, res) => {
    const token = req.query.token  // 支付的订单token，通过token和外部换取支付订单信息
    const redirectUrl = req.query.redirect // 支付成功后的重定向地址
    if (!token) {
      res.status(400).end('请提供token')
    }
    const getJsConfig = config.getJsConfig(req.url)  // 获取JSConfig
    const getOrderInfo = config.getOrderInfo(token) // 换取订单信息

    const jsConfig = await getJsConfig
    const orderInfo = await getOrderInfo

    const payConfig = await getPayconfig(orderInfo)
    // 输出支付页面
    res.render('pay', { title: orderInfo.body, jsConfig, payConfig, redirect: redirectUrl })
  })
  /**
   * 支付成功回调middleware
   * @param {*} callback 
   */
  const middleware = (callback) => {
    return payMiddleware(initConfig).getNotify().done(async (message, req, res, next) => {
      message.time_end = formatWxDate(message.time_end) // 格式化时间

      try {
        await callback(message, req, res, next)  // 等待回调处理完毕，返回成功
        res.reply('success')
      } catch (err) {
        console.log(err)
        res.reply(err)
      }
    })
  }
  return {
    middleware
  }
}
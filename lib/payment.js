const { URL } = require('url')
const wechatPay = require('wechat-pay')
const fs = require('fs')
const path = require('path')

module.exports = (app, config) => {
  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'ejs')

  const Payment = wechatPay.Payment
  const payMiddleware = wechatPay.middleware
  const { partnerKey, appId, mchId, notifyUrl, pfx, spbillCreateIp, tradeType } = config.payment
  const initConfig = {
    partnerKey,
    appId,
    mchId,
    notifyUrl,
    pfx
  }
  const payment = new Payment(initConfig) 

  const wechatNotifyUrl = new URL(notifyUrl)
  const wechatPayCallbackPath = wechatNotifyUrl.pathname
  const origin = wechatNotifyUrl.origin

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
   */
  const formatWxDate = (date) => {
    return date.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1/$2/$3 $4:$5:$6')
  }

  app.get(config.payPath, async (req, res) => {
    const token = req.query.token
    const redirectUrl = req.query.redirect
    if (!token) {
      res.status(400).end('请提供token')
    }
    const getJsConfig = config.getJsConfig(req.url)
    const getOrderInfo = config.getOrderInfo(token)

    const jsConfig = await getJsConfig
    const orderInfo = await getOrderInfo

    const payConfig = await getPayconfig(orderInfo)
    res.render('pay', { title: orderInfo.body, jsConfig, payConfig, redirect: redirectUrl, mode: config.mode })
  })

  const middleware = (callback) => {
    return payMiddleware(initConfig).getNotify().done(async (message, req, res, next) => {
      message.time_end = formatWxDate(message.time_end)

      console.log('pay callback>>>')
      console.log(message)

      try {
        await callback(message, req, res, next)
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
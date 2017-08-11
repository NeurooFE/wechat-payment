const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const payment = require('../index')
const Parse = require('parse/node')
const http = require('http')

Parse.initialize('appId')
Parse.serverURL = 'http://localhost:1336/parse'

const config = {
  payPath: '/pay',
  async getJsConfig(path) {
    return await Parse.Cloud.run('getYuerJsConfig', {url: `http://m.neuroo.com${path}`, jsApiList: ['chooseWXPay']})
  },
  getOrderInfo: function(token) {
    return {
      openId: '', 
      orderNo: new Date().getTime(),
      price: '32323',
      body: 'test'
    }
  },
  payment: {
    partnerKey: '',
    appId: '',
    mchId: '',
    notifyUrl: 'http://oc.neuroo.com/pay/callback',
    pfx: fs.readFileSync(path.join(__dirname, './apiclient_cert.p12')),
    spbillCreateIp: '',
    tradeType: 'JSAPI'
  }
}
const middleware = payment(app, config).middleware
app.use('/pay/callback', middleware(async (message, req, res, next) => {
  console.log(message)
}))

app.listen(8082, () => {
  console.log('listen on 8082')
})


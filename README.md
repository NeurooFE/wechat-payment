# wechat-payment

[![GitHub issues](https://img.shields.io/github/issues/NeurooFE/wechat-payment.svg)](https://github.com/NeurooFE/wechat-payment/issues)
[![GitHub forks](https://img.shields.io/github/forks/NeurooFE/wechat-payment.svg)](https://github.com/NeurooFE/wechat-payment/network)
[![GitHub stars](https://img.shields.io/github/stars/NeurooFE/wechat-payment.svg)](https://github.com/NeurooFE/wechat-payment/stargazers)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/NeurooFE/wechat-payment.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=%5Bobject%20Object%5D)

## 描述

微信支付中间件。

提供了一个支付成功回调的中间件，并会根据配置的路由，自动生成支付页面。

## 依赖

* [^node 7.x](https://github.com/nodejs/node)

## 安装

```javascript
yarn add @neuroo_fe/wechat-payment
```

或者

```javascript
npm install @neuroo_fe/wechat-payment --save
```

## 使用

### 后端

```javascript
const express = require('express')
const app = express()
const payment = require('@neuroo_fe/wechat-payment')
const middleware = payment(app, config).middleware  // 关于config,后面文档会提到
app.use('/pay/callback', middleware(async (message, req, res, next) => {
	// 支付成功后的逻辑，message为微信返回的字段，只对 `time_end` 做了格式化处理，处理成 `2017/08/08 08:08:08` 的时间格式
}))
```

### 前端

```javascript
location.href = `yourpaypath?token=youtoken&redirect=${location.href}`
```

一般前端在创建订单后，会有订单号，可以将订单号作为 `token` ，将当前页面地址作为成功后返回的地址

## config

| 属性名          | 说明                                       | 类型       | 必填   | 参数          | 返回值                                      |
| ------------ | ---------------------------------------- | -------- | ---- | ----------- | ---------------------------------------- |
| payPath      | 支付路径，必须跟微信配置的支付路径一致                      | string   | true | --          | --                                       |
| getJsConfig  | 获取微信 `JsApiConfig` 的回调函数，返回的参数必须跟[微信要求](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115)的一致，并且包含 ` chooseWXPay` 权限。回调函数的参数 `url` 为支付页面的路径（不包含 `origin`），`orgin` 为当前页面的域名。 | function | true | url, origin | { debug, appId, timestamp, nonceStr, signatrue, jsApiList } |
| getOrderInfo | 获取订单信息的回调函数，回调函数的参数 `token` 是用来获取唯一订单的凭证 | function | true | token       | object                                   |
| payment      | 支付配置                                     | object   | true | --          | --                                       |

### getJsConfig 回调函数返回值

`getOrderInfo` 回调函数必须返回一个对象，对象中必须包含下面的参数

| 属性名     | 说明                    | 类型                 |
| ------- | --------------------- | ------------------ |
| openId  | 下单者的 `openid`         | string             |
| orderNo | 唯一订单号                 | string             |
| price   | 价格，以分为单位              | number \|\| string |
| body    | 客服消息的标题，同样也会作为支付页面的标题 | string             |

### payment 参数说明

`payment` 也为一个对象，具体键值如下：

| 属性名            | 说明                                       | 类型     |
| -------------- | ---------------------------------------- | ------ |
| partnerKey     | 参考微信开发者文档                                | string |
| appId          | 参考微信开发者文档                                | string |
| mchId          | 参考微信开发者文档                                | string |
| notifyUrl      | 支付成功的回调地址，必须跟使用中间件的地址一致，这里的地址为全写的 `url` ,必须包含域名。 | string |
| pfx            | 参考微信开发者文档                                | buffer |
| spbillCreateIp | 参考微信开发者文档                                | string |
| tradeType      | 参考微信开发者文档                                | string |


'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();
var Date2 = app.require('scripts/date2');

var LAST_ORDER_ID = 'order-prompt-order';
var TIME = 2 * 24 * 60; // 提前多久展示，单位分钟

/**
 * 组件
 * 在page组件里实例化
 * 在bindEvent方法里关联页面时间处理函数
 * 组件data里的数据在page组件里通过指定的key获取
 */
function OrderPrompt() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.key = 'OrderPrompt';
  this.data = {
    isShowOrderPrompt: false,
    list: []
  };
  this.config = config;

  this.LAST_ORDER_ID = LAST_ORDER_ID;
  if (config.movieId) {
    this.LAST_ORDER_ID = LAST_ORDER_ID + '-' + config.movieId;
  }

  this.page = config.page || app.page();
  this.key = config.key || this.key;

  this.setData(this.data);
  this.bindEvent();
  this.fetchData();
}

OrderPrompt.prototype = {
  bindEvent: function bindEvent() {
    this.page.onTapOrderPromptClose = this.onTapOrderPromptClose.bind(this);
    this.page.onTapOrderPromptQrcode = this.onTapOrderPromptQrcode.bind(this);
  },
  fetchData: function fetchData() {
    var _this = this;

    var lastOrderId = parseInt(app.get(this.LAST_ORDER_ID), 10);

    if (!app.$user || !app.$user.token) {
      return;
    }

    app.request().get('/wxapi/orderquery/v7/user/orders.json').header('token', app.$user.token).query({
      cate: 100,
      clientType: 'touch',
      channelId: app.channelId
    }).end().then(function (res) {
      var list = res.body.data.orders.filter(function (item) {
        return !_this.config.movieId || _this.config.movieId === item.movie.id;
      }).filter(function (item) {
        var timediff = item.show.startTime - new Date();
        var timediffMsgArr = void 0;
        if (Math.abs(timediff) > TIME * 60 * 1000) {
          return false;
        }

        var minutes = Math.round(Math.abs(timediff) / 60 / 1000) + '分钟';
        if (timediff < 0) {
          timediffMsgArr = ['已开场', minutes];
        } else {
          timediffMsgArr = ['距开场', minutes];
        }

        item.timediffMsgArr = timediffMsgArr;

        item.exchange.originIdChunk = app.code(item.exchange.originId);
        item.exchange.exchangeCodeChunk = app.code(item.exchange.exchangeCode);

        item.timeMsg = new Date2(item.show.startTime).toString('E MM月dd日 HH:mm');

        return true;
      }).sort(function (itemA, itemB) {
        return itemA.show.startTime - itemB.show.startTime;
      });

      var isShowOrderPrompt = true;
      if (list.length && list[0].id === lastOrderId) {
        isShowOrderPrompt = false;
      }

      _this.setData({
        isShowOrderPrompt: isShowOrderPrompt,
        list: list
      });
    });
  },
  onTapOrderPromptClose: function onTapOrderPromptClose() {
    var lastestOrderId = this.data.list[0].id;

    app.set(this.LAST_ORDER_ID, lastestOrderId, { expires: 2 * 60 * 60 });

    this.setData({
      isShowOrderPrompt: false
    });
  },
  onTapOrderPromptQrcode: function onTapOrderPromptQrcode(e) {
    wx.previewImage({
      urls: [app.url + '/qr?text=' + e.target.dataset.qrcode]
    });
  },
  setData: function setData(data) {
    this.data = _extends({}, this.data, data);

    var ret = {};
    ret[this.key] = this.data;

    this.page.setData(ret);
  }
};

app.stats(OrderPrompt.prototype);

OrderPrompt.prototype.constructor = OrderPrompt;

module.exports = OrderPrompt;
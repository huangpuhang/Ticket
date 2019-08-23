'use strict';

var app = getApp();

var PROD = true;

app.MoviePage({
  data: {
    modalHidden: true
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.setData(options);
    var orderId = options.orderId;

    this.loading();
    app.request().get('/hostproxy' + (PROD ? '' : '/api') + '/queryorder/v1/refunddetail.json').header({
      token: app.$user.token

    }).query({
      token: app.$user.token,
      orderId: orderId
    }).end().then(function (res) {
      var _res$body$data = res.body.data,
          refundInfo = _res$body$data.refundInfo,
          toRefundInfo = _res$body$data.toRefundInfo;

      var refundModeText = [];
      var refundModeTextMap = {
        cashierMoney: '现金将于1-7个工作日内退还到原支付方',
        couponMoney: '优惠券将退至您的账户中',
        withPointCard: '点数退回礼品卡内'
      };
      for (var key in refundModeTextMap) {
        if (refundInfo[key]) {
          refundModeText.push(refundModeTextMap[key]);
        }
      }
      refundModeText = refundModeText.length ? '\uFF08' + refundModeText.join('，') + '\uFF09' : '';
      var data = {
        count: {
          remain: toRefundInfo.refundCountInfo.refundCount,
          max: toRefundInfo.refundCountInfo.refundMaxCount
        },
        mode: {
          info: '原路退回',
          remarks: refundModeText
        },
        cashierMoney: {
          info: '现金',
          value: refundInfo.cashierMoney,
          text: refundInfo.cashierMoney / 100 + '\u5143'
        },
        refundFee: {
          info: '手续费',
          value: refundInfo.refundFee,
          text: '' + (refundInfo.refundFee ? '-' : '') + refundInfo.refundFee / 100 + '\u5143'
        },
        refundMoney: {
          info: '实际退还',
          value: refundInfo.cashierMoney - (refundInfo.refundFee || 0),
          text: (refundInfo.cashierMoney - (refundInfo.refundFee || 0)) / 100 + '\u5143'
        },
        couponMoney: {
          info: '优惠券',
          value: refundInfo.couponMoney,
          text: (refundInfo.couponNumber ? '\uFF08' + refundInfo.couponNumber + '\u5F20\uFF09' : '') + (refundInfo.couponMoney / 100 + '\u5143')
        },
        pointCardMoney: {
          info: '礼品卡',
          value: refundInfo.withPointCard,
          text: (refundInfo.pointCardNum ? '\uFF08' + refundInfo.pointCardNum + '\u70B9\uFF09' : '') + (refundInfo.pointCardMoney + '\u5143')
        }
      };
      _this.setData(data);
    }).catch(function (err) {
      return _this.handleError(err, 'page');
    }).then(function () {
      _this.loading(false);
    });
  },
  applyRefundFunc: function applyRefundFunc() {
    var refundFee = this.data.refundFee;

    if (refundFee.value) {
      this.setData({
        modalHidden: false,
        modalText: '\u672C\u6B21\u9000\u7968\u4F1A\u6536\u53D6' + refundFee.value / 100 + '\u5143\u624B\u7EED\u8D39'
      });
    } else {
      this.submitApply();
    }
  },
  submitApply: function submitApply() {
    var _this2 = this;

    var orderId = this.data.orderId;

    app.request().post('/hostproxy' + (PROD ? '' : '/api') + '/createorder/v1/refund.json').header({
      token: app.$user.token

    }).query({
      orderId: orderId,
      token: app.$user.token,
      refundMethod: 1,
      uuid: app.$uuid
    }).end().then(function (res) {
      var urlObj = {
        url: '/pages/order/refund/detail?orderId=' + _this2.data.orderId
      };
      wx.redirectTo(urlObj);
    }).catch(function (err) {
      return _this2.handleError(err);
    });
  },
  modalConfirm: function modalConfirm() {
    this.submitApply();
    this.modalCancel();
  },
  modalCancel: function modalCancel() {
    this.setData({
      modalHidden: true
    });
  }
});
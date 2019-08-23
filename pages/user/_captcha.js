'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

function Captcha() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.key = 'Captcha';
  this.data = {
    showCaptcha: false,
    inputCaptcha: '',
    captchaHash: +new Date(),
    errorMsg: ''
  };

  this.page = config.page || app.page();
  this.key = config.key || this.key;

  this.setData(this.data);
  this.bindEvent();
}

Captcha.prototype = {
  bindEvent: function bindEvent() {
    this.page.onInputCaptcha = this.onInputCaptcha.bind(this);
    this.page.onHideCaptcha = this.onHideCaptcha.bind(this);
    this.page.updateCaptcha = this.update.bind(this);
  },
  onInputCaptcha: function onInputCaptcha(e) {
    this.data.inputCaptcha = e.detail.value;
  },
  onHideCaptcha: function onHideCaptcha() {
    this.hide();
  },
  show: function show() {
    this.setData({
      showCaptcha: true,
      inputCaptcha: '',
      errorMsg: ''
    });
    this.update();
  },
  isShow: function isShow() {
    return !!this.data.showCaptcha;
  },
  hide: function hide() {
    this.setData({
      showCaptcha: false,
      inputCaptcha: '',
      errorMsg: ''
    });
  },
  update: function update() {
    this.setData({
      captchaHash: +new Date()
    });
  },
  error: function error(errorMsg) {
    this.setData({
      errorMsg: errorMsg,
      inputCaptcha: ''
    });
    this.update();
  },
  clear: function clear() {
    this.setData({
      inputCaptcha: ''
    });
  },
  setData: function setData(data) {
    this.data = _extends({}, this.data, data);

    var ret = {};
    ret[this.key] = this.data;

    this.page.setData(ret);
  }
};

Captcha.prototype.constructor = Captcha;

module.exports = Captcha;
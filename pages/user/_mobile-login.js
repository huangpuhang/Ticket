'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

var counter = app.require('scripts/counter.js');

var CODE_BTN_MSG = '获取验证码';

function MobileLogin() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.key = 'MobileLogin';

  this.data = {
    inputMobile: '',
    codeBtnDisabled: true,
    codeBtnMsg: CODE_BTN_MSG,
    inputCode: '',
    submitDisabled: true,
    showMobileDel: false,
    codeHasSent: false
  };

  this.page = config.page || app.page();
  this.key = config.key || this.key;

  this.setData(this.data);
  this.bindEvent();
}

MobileLogin.prototype = {
  bindEvent: function bindEvent() {
    this.page.onInputMobile = this.onInputMobile.bind(this);
    this.page.onInputCode = this.onInputCode.bind(this);
    this.page.onDeleteMobile = this.onDeleteMobile.bind(this);
  },
  onInputMobile: function onInputMobile(e) {
    this.data.inputMobile = e.detail.value;

    this.updateDelBtnStatus();
    this.updateCodeBtnStatus();
    this.updateSubmitBtnStatus();
  },
  onInputCode: function onInputCode(e) {
    this.data.inputCode = e.detail.value;

    this.updateSubmitBtnStatus();
  },
  getCode: function getCode(captcha) {
    var _this = this;

    return app.uuid().then(function (uuid) {
      var formData = {
        uuid: uuid,
        mobile: _this.data.inputMobile
      };
      if (captcha) {
        formData.captcha = captcha;
      }

      return app.request().config('barLoading', true).post('/proxy/api/v1/account/mobilelogincode').header('x-host', 'http://passport.vip.sankuai.com').send(formData).end().then(function (res) {
        _this.counter = counter.init({
          key: 'mobile-login',
          tick: function tick(total) {
            _this.setData({
              codeBtnMsg: total + 's\u540E\u91CD\u8BD5',
              codeBtnDisabled: true,
              codeHasSent: true
            });
          },
          end: function end() {
            _this.setData({
              codeBtnMsg: CODE_BTN_MSG
            });
            _this.updateCodeBtnStatus();
          }
        });
        return res;
      });
    });
  },
  login: function login() {
    var _data = this.data,
        inputMobile = _data.inputMobile,
        inputCode = _data.inputCode;

    return app.request().config('barLoading', true).post('/proxy/api/v1/account/mobilelogin').header('x-host', 'http://passport.vip.sankuai.com').send({
      mobile: inputMobile,
      code: inputCode
    }).end();
  },
  clearCode: function clearCode() {
    this.setData({
      inputCode: ''
    });
    this.updateSubmitBtnStatus();
  },
  updateSubmitBtnStatus: function updateSubmitBtnStatus() {
    this.setData({
      submitDisabled: !!(String(this.data.inputMobile).length !== 11 || !this.data.inputCode)
    });
  },
  updateCodeBtnStatus: function updateCodeBtnStatus() {
    this.setData({
      codeBtnDisabled: !!(String(this.data.inputMobile).length !== 11 || this.isCounting()),
      codeHasSent: this.isCounting()
    });
  },
  updateDelBtnStatus: function updateDelBtnStatus() {
    this.setData({
      showMobileDel: !!this.data.inputMobile.length
    });
  },
  onDeleteMobile: function onDeleteMobile() {
    this.setData({
      inputMobile: '',
      showMobileDel: false
    });
    this.updateCodeBtnStatus();
  },
  isCounting: function isCounting() {
    return !!(this.counter && this.counter.total > 0);
  },
  setData: function setData(data) {
    this.data = _extends({}, this.data, data);

    var ret = {};
    ret[this.key] = this.data;

    this.page.setData(ret);
  }
};

MobileLogin.prototype.constructor = MobileLogin;

module.exports = MobileLogin;
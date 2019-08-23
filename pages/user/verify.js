'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * http://wiki.sankuai.com/pages/viewpage.action?pageId=624269655
 */
var app = getApp();

var _common = require('./_common');
var Captcha = require('./_captcha');

var counter = app.require('scripts/counter.js');

var passportHost = 'http://open.vip.sankuai.com';
// const passportHost = 'http://open.sso.mtp.dev.sankuai.com'

// const accounts = [{
//   id: 29008301,
//   ticket: 'OOLTNcjnauJXjZTIhtAATbTQKgXdGSUGPsjSPVdw',
//   nickname: 'paytest',
//   userid: 29008301,
//   avatarurl: 'http://p0.meituan.net/avatar/2ce6d7bace672f0c78b64e55811b4b4510179.jpg',
// }, {
//   id: 29008689,
//   ticket: 'JoZRabgKqMOmuJxkoRDAeuAUCkWeXOVnWmPZYUgo',
//   nickname: '132****2002',
//   userid: 29008689,
//   avatarurl: 'http://p1.meituan.net/avatar/27c3cc6d0382a066adf64dba4e719c6711264.jpg',
// }]

var CODE_BTN_MSG = '获取验证码';

app.MoviePage(_extends({}, _common, {
  data: {
    submitDisabled: true,
    codeBtnDisabled: true,
    codeBtnMsg: CODE_BTN_MSG,
    // errorCode: 0,
    errorMsg: '',
    showMobileDel: false,
    showCodeDel: false,
    isFocusMobile: false,
    isFocusCode: false,
    uuid: '',
    $theme: app.$theme,
    inputMobile: '',
    inputCode: ''
  },
  onLoad: function onLoad(options) {
    this.options = options;
    this.setData({
      uuid: app.$uuid
    });

    this.captcha = new Captcha();
  },
  onUnload: function onUnload() {
    this.counter && this.counter.clear();
  },
  onConfirmCaptcha: function onConfirmCaptcha() {
    this.getCode();
  },
  getCode: function getCode() {
    var _this = this;

    if (this.data.codeBtnDisabled) {
      return;
    }
    var userInfo = app.$wxUserInfo;

    var formData = {
      mobile: this.data.inputMobile,
      openId: app.$openId,
      rawData: userInfo.rawData,
      signature: userInfo.signature,
      encryptedData: userInfo.encryptedData,
      iv: userInfo.iv
    };

    if (this.captcha.data.inputCaptcha) {
      formData.captcha = this.captcha.data.inputCaptcha;
    }

    return app.request().config('barLoading', true).post('/hostproxy/user/v2/weappmobilelogincode').query('uuid', app.$uuid).header('x-host', passportHost).send(formData).end().then(function (res) {
      _this.counter = counter.init({
        key: 'mobile-verify',
        tick: function tick(total) {
          _this.setData({
            codeBtnMsg: total + 's\u540E\u91CD\u8BD5',
            codeBtnDisabled: true
          });
        },
        end: function end() {
          _this.setData({
            codeBtnMsg: CODE_BTN_MSG
          });
          _this.updateCodeBtnStatus();
        }
      });
      _this.captcha.hide();
    }).catch(function (err) {
      var error = err.res.data.error;
      if (error) {
        switch (error.code) {
          // 需要验证码
          case 101091:
            _this.captcha.show();
            return;
          // 验证码输入错误
          case 101092:
            _this.captcha.error(error.message);
            return;
          // 会话已过期
          case 101172:
            _this.reLogin();
            return;
          default:
            break;
        }
      }
      _this.handleError(err);
    });
  },
  bindPhone: function bindPhone(e) {
    var _this2 = this;

    var formData = e.detail.value;
    var userInfo = app.$wxUserInfo;

    return app.request().config('barLoading', true).post('/hostproxy/user/v2/weappmobilelogin?uuid=' + app.$uuid).header('x-host', passportHost).send({
      mobile: this.data.inputMobile,
      code: formData.code,
      openId: app.$openId,
      rawData: userInfo.rawData,
      signature: userInfo.signature,
      encryptedData: userInfo.encryptedData,
      iv: userInfo.iv
    }).end().catch(function (err) {
      var error = err.res.data.error;
      if (error) {
        switch (error.code) {
          // 会话已过期
          case 101172:
            _this2.reLogin();
            return;
          // 手机动态码错误，不需要重新获取动态码
          case 101095:
            break;
          // 有两个帐号，登录第一个
          case 101188:
            return _this2.ticketLogin(error.data.userInfos[0]);
          // 需要重新获取动态码
          default:
            _this2.setData({
              inputCode: '',
              submitDisabled: true
            });
            break;
        }
      }
      _this2.handleError(err);
    }).then(function (res) {
      var resData = res.body.data;

      if (resData) {
        _this2.updateAppUser(resData);
      }

      _this2.back();
    });
  },
  onInputMobile: function onInputMobile(e) {
    var showMobileDel = false;
    if (e.detail.value) {
      showMobileDel = true;
    }

    var codeBtnDisabled = true;

    this.data.inputMobile = e.detail.value;
    var data = {
      showMobileDel: showMobileDel,
      codeBtnDisabled: codeBtnDisabled
    };

    this.setData(data);
    this.updateCodeBtnStatus();
    this.updateSumitBtnStatus();
  },
  onDeleteMobile: function onDeleteMobile() {
    this.setData({
      inputMobile: '',
      showMobileDel: false,
      submitDisabled: true,
      codeBtnDisabled: true
    });
    this.setData({
      isFocusMobile: true
    });
    this.setData({
      isFocusMobile: false
    });
  },
  onInputCode: function onInputCode(e) {
    var showCodeDel = false;
    if (e.detail.value) {
      showCodeDel = true;
    }

    this.data.inputCode = e.detail.value;
    var data = {
      showCodeDel: showCodeDel
    };

    this.setData(data);

    this.updateSumitBtnStatus();
  },
  onDeleteCode: function onDeleteCode() {
    this.setData({
      inputCode: '',
      showCodeDel: false,
      submitDisabled: true
    });
    this.setData({
      isFocusCode: true
    });
    this.setData({
      isFocusCode: false
    });
  },
  reLogin: function reLogin(msg) {
    var that = this;
    msg = msg || '登录失败，请重新登录';
    wx.showModal({
      content: msg,
      showCancel: false,
      success: function success() {
        that.back();
      }
    });
  },
  updateCodeBtnStatus: function updateCodeBtnStatus() {
    var codeBtnDisabled = this.counter && this.counter.total > 0 || String(this.data.inputMobile).length !== 11;
    this.setData({
      codeBtnDisabled: codeBtnDisabled
    });
  },
  updateSumitBtnStatus: function updateSumitBtnStatus() {
    this.setData({
      submitDisabled: String(this.data.inputMobile).length !== 11 || !this.data.inputCode
    });
  },
  onTapAccount: function onTapAccount(e) {
    this.setData({
      acSelectedAccount: this.data.acAccounts[e.currentTarget.dataset.index]
    });
  },
  ticketLogin: function ticketLogin(account) {
    var userid = account.userid,
        ticket = account.ticket;


    return app.uuid().then(function (uuid) {
      return app.request().post('/hostproxy/user/v2/weappticketlogin').header('x-host', passportHost).query(uuid, uuid).send({
        userid: userid,
        ticket: ticket
      }).end();
    });
  }
}));
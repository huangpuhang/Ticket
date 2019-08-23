'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();
var _common = require('./_common');
var Captcha = require('./_captcha');
var loginScript = require('../../scripts/login');

var LOGIN_ERROR_CODES = {
  REQUIRE_MOBILE: 101155
};

var PROD = true;

app.MoviePage(_extends({}, _common, {
  data: {
    inputAccount: '',
    inputPassword: '',
    submitDisabled: true,
    uuid: app.$uuid,
    loginType: 'password' // password/mobile
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;

    if (options.warn) {
      this.toast(decodeURIComponent(options.warn));
    }

    app.uuid().then(function (uuid) {
      _this.setData({
        uuid: uuid
      });
    });

    this.captcha = new Captcha();
    loginScript.openId().then(wx.login);
  },
  onConfirmCaptcha: function onConfirmCaptcha() {
    var loginType = this.data.loginType;

    if (loginType === 'password') {
      this.onSubmit();
    } else if (loginType === 'mobile') {
      this.onTapGetCode();
    }
  },

  /**
   * 跳转到账号登录
   */
  onTapAccountLogin: function onTapAccountLogin() {
    app.goto('./account-login');
  },
  onHandleOneKeyLoginSuccess: function onHandleOneKeyLoginSuccess() {
    setTimeout(this.back.bind(this), 2000);
  },

  /**
   * 手机号一键登录
   * @param {*} e
   */
  onTapOneKeyLogin: function onTapOneKeyLogin(e) {
    if (e.detail.errMsg.indexOf('getPhoneNumber:ok') < 0) return;

    if (!app.$openId) {
      return loginScript.openId().then(this.oneKeyLogin.bind(this, e));
    }

    this.oneKeyLogin(e);
  },
  oneKeyLogin: function oneKeyLogin(e) {
    var _this2 = this;

    app.wx2promiseify(wx.login).then(function (res) {
      return res.code;
    }).then(function (code) {
      app.request().post('/hostproxy/user/v2/weappgetmobilelogin').header({
        'x-host': PROD ? 'http://open.vip.sankuai.com' : 'http://open.apitest.meituan.com'
      }).query('uuid', app.$uuid).send(_extends({
        code: code,
        appName: 'movie'
      }, e.detail)).end().then(function (res) {
        return res.body.data;
      }).then(function (res) {
        _this2.updateAppUser(res);
        _this2.toast('登录成功');
        _this2.onHandleOneKeyLoginSuccess();
      }).catch(function (err) {
        _this2.handleError(err);
      });
    });
  },

  /**
   * 微信登录
   */
  onTapWechatLogin: function onTapWechatLogin(e) {
    this.checkOpenId(this._onTapWechatLogin.bind(this))(e);
  },
  _onTapWechatLogin: function _onTapWechatLogin() {
    var _this3 = this;

    wx.showNavigationBarLoading();

    this.wechatLogin().then(function (user) {
      _this3.toast('微信登录成功');
      setTimeout(_this3.back.bind(_this3), 2000);
    }).catch(function (err) {
      if (err && err.res && err.res.data && err.res.data.error.code === LOGIN_ERROR_CODES.REQUIRE_MOBILE) {
        _this3.gotoVerifyPage();
      } else if (loginScript.isPermissionDeny(err)) {
        loginScript.reGetPermission().then(function () {
          _this3._onTapWechatLogin();
        });
      } else {
        _this3.handleError(err);
      }
    }).then(wx.hideNavigationBarLoading, wx.hideNavigationBarLoading);
  },
  gotoVerifyPage: function gotoVerifyPage() {
    var _this4 = this;

    var query = Object.keys(this.options).map(function (key) {
      return key + '=' + _this4.options[key];
    }).join('&');

    wx.redirectTo({
      url: './verify?' + query
    });
  },

  /**
   * fn依赖openId
   */
  checkOpenId: function checkOpenId(fn) {
    var _this5 = this;

    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      loginScript.openId().then(function () {
        fn.apply(_this5, args);
      }).catch(function (err) {});
    };
  },
  wechatLogin: function wechatLogin() {
    var _this6 = this;

    return loginScript.fetchWechatLoginInfo().then(function (res) {
      _this6.updateAppUser(res.body.data);
    }).then(function () {
      if (app.$user.token) {
        app.request().get('/profile?token=' + app.$user.token).end().then(function (res) {
          app.$user.mobile = res.body.mobile;
          _this6.updateAppUser(app.$user);
        });
      }
    });
  },

  /**
   * 更新提交按钮状态
   */
  updateSumitBtnStatus: function updateSumitBtnStatus() {
    var _data = this.data,
        inputAccount = _data.inputAccount,
        inputPassword = _data.inputPassword;

    this.setData({
      submitDisabled: !(inputAccount.length && inputPassword.length)
    });
  }
}));
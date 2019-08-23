'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();
var _common = require('./_common');
var Captcha = require('./_captcha');
var MobileLogin = require('./_mobile-login');
var loginScript = require('../../scripts/login');

var LOGIN_ERROR_CODES = {
  REQUIRE_MOBILE: 101155
};

app.MoviePage(_extends({}, _common, {
  data: {
    inputAccount: '',
    inputPassword: '',
    submitDisabled: true,
    uuid: app.$uuid,
    loginType: 'password', // password/mobile
    licenceContentTpl: 'login-licence'
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
    this.mobileLogin = new MobileLogin();
  },
  goBack: function goBack() {
    var prevPage = app.page(-2);

    if (prevPage && prevPage.route.indexOf('user/login') >= 0) {
      wx.navigateBack({ delta: 2 });
    } else if (app._loginReturnUrl.indexOf(prevPage.route) === 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({
        url: decodeURIComponent(app._loginReturnUrl)
      });
    }
  },

  /**
   * 帐号登录事件处理方法
   */
  onSubmit: function onSubmit(e) {
    this.checkOpenId(this._onSubmit.bind(this))(e);
  },
  _onSubmit: function _onSubmit() {
    var _this2 = this;

    wx.showNavigationBarLoading();
    this.accountLogin().then(function () {
      _this2.toast('登录成功');
      _this2.captcha.hide();
      setTimeout(_this2.goBack.bind(_this2), 2000);
    }).catch(function (err) {
      var error = void 0;
      if (err && err.res && err.res.data) {
        error = err.res.data.error;
        switch (error.type) {
          case 'user_err_login_need_captcha':
            _this2.captcha.show();
            return;
          case 'user_err_login_captcha_err':
            _this2.captcha.error(error.message);
            return;
          default:
            break;
        }
      }

      _this2.captcha.hide();

      if (error && error.message) {
        var toastErrors = ['user_err_password_wrong', 'user_err_spam_login'];
        var msg = error.message;

        if (toastErrors.indexOf(error.type) !== -1) {
          msg = '帐号或密码错误，请重新输入';
          _this2.toast(msg);
          return;
        }

        if (error.type === 'user_err_password_none') {
          msg = '您的账号还未设置密码，请手机访问i.meituan.com进行快捷登录，登录后请设置密码';
        }

        wx.showModal({
          content: msg,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        _this2.handleError(err);
      }
    }).then(wx.hideNavigationBarLoading, wx.hideNavigationBarLoading);
  },

  /**
   * 手机号快捷登录
   */
  onSubmitMobileLogin: function onSubmitMobileLogin(e) {
    this.checkOpenId(this._onSubmitMobileLogin.bind(this))(e);
  },
  _onSubmitMobileLogin: function _onSubmitMobileLogin() {
    var _this3 = this;

    return this.openId().then(function () {
      return _this3.mobileLogin.login();
    }).then(function (res) {
      var _res$body$user = res.body.user,
          id = _res$body$user.id,
          token = _res$body$user.token,
          mobile = _res$body$user.mobile;

      _this3.updateAppUser({
        token: token,
        mobile: mobile,
        userId: id
      });
      _this3.toast('登录成功');
      setTimeout(_this3.goBack.bind(_this3), 2000);
    }).catch(function (err) {
      if (err && err.res && err.res.data) {
        var error = err.res.data.error;
        switch (error) {
          case 'user_err_mobile_code_expired':
            _this3.mobileLogin.clearCode();
            break;
          case 'user_err_mobile_code_invalid':
            _this3.mobileLogin.clearCode();
            break;
          default:
            break;
        }
      }
      _this3.handleError(err);
    });
  },

  /**
   * 手机号快捷登录 - 获取验证码
   */
  onTapGetCode: function onTapGetCode(e) {
    var _this4 = this;

    if (e && e.target.dataset.disabled) {
      return;
    }

    var inputCaptcha = this.captcha.data.inputCaptcha;


    return this.mobileLogin.getCode(inputCaptcha).then(function (res) {
      _this4.captcha.hide();
    }).catch(function (err) {
      if (err && err.res && err.res.data) {
        var error = err.res.data.error;
        switch (error.type) {
          case 'user_err_need_captcha':
            _this4.captcha.show();
            return;
          case 'user_err_captcha_error':
            _this4.captcha.error(error.message);
            return;
          default:
            break;
        }
      }
      _this4.handleError(err);
    });
  },
  onConfirmCaptcha: function onConfirmCaptcha() {
    var loginType = this.data.loginType;

    if (loginType === 'password') {
      this.onSubmit();
    } else if (loginType === 'mobile') {
      this.onTapGetCode();
    }
  },
  onInputAccount: function onInputAccount(e) {
    this.data.inputAccount = e.detail.value;
    // this.setData({
    //   inputAccount: e.detail.value,
    // })

    this.updateSumitBtnStatus();
  },
  onInputPassword: function onInputPassword(e) {
    this.data.inputPassword = e.detail.value;
    // this.setData({
    //   inputPassword: e.detail.value,
    // })

    this.updateSumitBtnStatus();
  },
  onTapLoginTab: function onTapLoginTab(e) {
    this.setData({
      loginType: e.target.dataset.type
    });
  },

  /**
   * 帐号登录
   */
  openId: function openId() {
    if (app.$openId) {
      return Promise.resolve(app.$openId);
    }
    return loginScript.openId().then(function () {
      return app.$openId;
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

      _this5.openId().then(function () {
        fn.apply(_this5, args);
      }).catch(function (err) {
        _this5.toast('登录失败，请稍后重试');
      });
    };
  },
  accountLogin: function accountLogin() {
    var _this6 = this;

    var _data = this.data,
        inputAccount = _data.inputAccount,
        inputPassword = _data.inputPassword;
    var inputCaptcha = this.captcha.data.inputCaptcha;


    var formData = {
      email: inputAccount,
      password: inputPassword
    };

    if (inputCaptcha) {
      formData.captcha = inputCaptcha;
    }

    var accountLoginPromise = app.request().post('/hostproxy/api/v4/account/login').header('x-host', 'http://passport.vip.sankuai.com').query('uuid', app.$uuid).send(formData).end();

    return Promise.all([this.openId(), accountLoginPromise]).then(function (rets) {
      var res = rets[1];
      var _res$body$user2 = res.body.user,
          id = _res$body$user2.id,
          token = _res$body$user2.token,
          mobile = _res$body$user2.mobile;

      _this6.updateAppUser({
        token: token,
        mobile: mobile,
        userId: id
      });
      return res;
    });
  },

  /**
   * 更新提交按钮状态
   */
  updateSumitBtnStatus: function updateSumitBtnStatus() {
    var _data2 = this.data,
        inputAccount = _data2.inputAccount,
        inputPassword = _data2.inputPassword;

    this.setData({
      submitDisabled: !(inputAccount.length && inputPassword.length)
    });
  }
}));
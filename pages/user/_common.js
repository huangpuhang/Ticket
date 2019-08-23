"use strict";

module.exports = {
  back: function back() {
    var app = getApp();

    if (this._options.path) {
      delete app._loginReturnUrl;
      wx.redirectTo({
        url: decodeURIComponent(this._options.path)
      });
    } else if (app._loginReturnUrl && app._page5) {
      wx.redirectTo({
        url: decodeURIComponent(app._loginReturnUrl)
      });
    } else {
      wx.navigateBack();
    }
  },
  updateAppUser: function updateAppUser(_ref) {
    var token = _ref.token,
        userId = _ref.userId,
        mobile = _ref.mobile;

    var app = getApp();
    app.$user.token = token;
    app.$user.userId = userId;
    app.$user.mobile = mobile || this.data.inputMobile; // 绑定的手机号
    app.$user.isBindMobile = true;
    app.$user.openId = app.$openId;
    app.$user.wxUserInfo = app.$wxUserInfo || {};

    app.saveUser();
  }
};
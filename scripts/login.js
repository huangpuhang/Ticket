'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

var loginScript = {
  fetchWechatLoginInfo: function fetchWechatLoginInfo() {
    var _this2 = this;

    if (this._wechatPromise) {
      return this._wechatPromise;
    }
    function wxUserInfo(code, res) {
      var _this = this;

      app.$wxUserInfo = res;
      res.code = code;
      res.appName = 'movie';
      return app.request().post('/hostproxy/user/v2/weapplogin').query('uuid', app.$uuid).header('content-type', 'application/x-www-form-urlencoded').header('x-host', 'http://open.vip.sankuai.com')
      // .header('x-host', 'http://open.sso.mtp.dev.sankuai.com')
      .send({
        code: res.code,
        appName: res.appName,
        rawData: res.rawData,
        signature: res.signature,
        encryptedData: res.encryptedData,
        iv: res.iv
      }).end().then(function (_res) {
        app.$openId = _res.body.openId;
        return _res;
      }).catch(function (err) {
        app.$openId = err.res.data.openId;
        delete _this._wechatPromise;
        if (~err.message.indexOf('未绑定')) {
          err.message = '';
        }
        throw err;
      });
    }

    this._wechatPromise = app.wx2promiseify(wx.login).then(function (res) {
      return res.code;
    }).then(function (code) {
      return app.wx2promiseify(wx.getUserInfo).then(wxUserInfo.bind(app, code));
    }).catch(function (err) {
      delete _this2._wechatPromise;
      throw err;
    });

    return this._wechatPromise;
  },
  wxUser: function wxUser() {
    function wxUser(userInfo, openId) {
      app.$wxUser = _extends({}, userInfo, { openId: openId });
      return app.$wxUser;
    }

    if (app.$wxUser) {
      return Promise.resolve(app.$wxUser);
    }

    if (app.$user.token && app.$user.wxUserInfo) {
      return Promise.resolve(wxUser(app.$user.wxUserInfo.userInfo, app.$user.openId));
    }

    app.$wxUser = app.get('wxUser');
    if (app.$wxUser) {
      return Promise.resolve(app.$wxUser);
    }

    return this.fetchWechatLoginInfo().then(function () {
      var wu = wxUser(app.$wxUserInfo.userInfo, app.$openId);
      app.set('wxUser', wu, { expires: 24 * 60 * 60 });
      return wu;
    });
  },
  openId: function openId() {
    if (app.$openId) {
      return Promise.resolve(app.$openId);
    }
    return app.wx2promiseify(wx.login).then(function (res) {
      return res.code;
    }).then(function (code) {
      return (
        // console.log(code)
        app.request().get('/wechat/ttlogin').query({
          code: code
        }).end().then(function (res) {
          if (res && res.body && res.body.code == 0) {
            app.$openId = res.body.data.userId;
            wx.setStorage({
              key: 'userId',
              data: res.body.data.userId
            })
          }
          // app.$openId = res.body.openid
        }).catch(function (err) {
          throw err;
        })
      );
    }).catch(function (err) {
      throw err;
    });
  },
  isPermissionDeny: function isPermissionDeny(err) {
    return err && err.errMsg && err.errMsg.match(/getUserInfo[:|\s]fail[:|\s]auth (deny|cancel)/);
  },
  reGetPermission: function reGetPermission() {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      if (wx.openSetting) {
        wx.showModal({
          title: '授权提示',
          content: '要先允许使用 [用户信息] 才可以登录哦',
          showCancel: true,
          confirmText: '去设置',
          success: function success(res) {
            if (res.confirm) {
              wx.openSetting({
                success: function success(_res) {
                  if (_res.authSetting['scope.userInfo']) {
                    resolve();
                  } else {
                    _this3.toast('授权失败');
                    var err = new Error('授权失败');
                    err.type = 'FAIL';
                    reject(err);
                  }
                }
              });
            } else {
              var err = new Error('未授权');
              err.type = 'DENY';
              reject(err);
            }
          }
        });
      } else {
        // 旧版本兼容
        wx.showModal({
          title: '授权提示',
          content: '要先微信授权才可以登录哦，请10分钟后再试',
          showCancel: false,
          confirmText: '我知道了'
        });
        var err = new Error('未授权');
        err.type = 'DENY';
        reject(err);
      }
    });
  }
};

module.exports = loginScript;
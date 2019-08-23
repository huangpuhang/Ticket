'use strict';

var store = require('./store');

module.exports = {
  /**
   * [用户信息]
   * @return {[type]} [description]
   */
  user: function user() {
    var app = getApp();
    if (app.$user.token) {
      return Promise.resolve(app.$user);
    }
    app.$user = store.get('user') || {};
    if (!app.$user.openId) {
      app.$user = {};
      store.remove('user');
    }
    if (app.$user.token) {
      return Promise.resolve(app.$user);
    }
    return Promise.reject(Error('未登录'));
  },
  saveUser: function saveUser() {
    var app = getApp();
    store.set('user', app.$user, { expires: 3 * 30 * 24 * 60 * 60 });
  },
  setMobile: function setMobile(mobile) {
    var app = getApp();
    app.$user.mobile = mobile;
    store.update('user', app.$user);
  },

  /**
   * 清空用户信息
   */
  logout: function logout() {
    var app = getApp();
    store.remove('user');
    app.$user = {};
  }
};
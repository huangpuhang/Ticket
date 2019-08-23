'use strict';

var init;
exports = module.exports = {
  params: function params(ev, cb) {
    var app = getApp();
    var params = init || {};

    // 位置
    var setLocation = function setLocation(res) {
      if (params.latitude && !res.latitude) {
        return;
      }

      params.latitude = res.latitude;
      params.longitude = res.longitude;
      params.speed = res.speed != null ? res.speed : -1;
      params.accuracy = res.accuracy != null ? res.accuracy : -1;
    };
    if (app.$location && app.$location.latitude) {
      setLocation(app.$location);
    }

    if (app.$location) {
      setLocation(app.$location);
    }

    // 网络类型
    if (!init) {
      params.networkType = 'unknow';
    }
    wx.getNetworkType({
      success: function success(res) {
        params.networkType = res.networkType;
      }
    });

    if (!init) {
      // 系统信息
      var setSystemInfo = function setSystemInfo(res) {
        params.model = res.model;
        params.pixelRatio = res.pixelRatio;
        params.windowWidth = res.windowWidth;
        params.windowHeight = res.windowHeight;
        params.language = res.language;
        params.version = res.version;
        params.system = res.system;
        params.platform = res.platform;
      };
      if (app.$systemInfo && app.$systemInfo.model) {
        setSystemInfo(app.$systemInfo);
      } else {
        app.systemInfo().then(setSystemInfo);
      }
      // 重力感应
      wx.onAccelerometerChange(function (res) {
        params.x = res.x;
        params.y = res.y;
        params.z = res.z;
      });

      // 罗盘
      wx.onCompassChange(function (res) {
        params.direction = res.direction;
      });
    }

    // 屏幕坐标
    var n;
    params.touchPoint = '';
    if (ev) {
      var touchPoint;
      try {
        touchPoint = ev.detail.x + ',' + ev.detail.y;
      } catch (e) {}
      try {
        touchPoint = touchPoint || ev.touches[0].pageX + ',' + ev.touches[0].pageY;
      } catch (e) {}
      try {
        touchPoint = touchPoint || ev.touches[0].x + ',' + ev.touches[0].y;
      } catch (e) {}
      if (touchPoint == null) {
        if (typeof ev === 'string') {
          touchPoint = ev;
        } else {
          touchPoint = JSON.stringify(ev);
        }
      }
      if (touchPoint) {
        params.touchPoint = touchPoint;
      }
    }

    // app_name user_type
    params.app_name = 'group';
    params.user_type = 'wx';

    init = params;
    var send = function send() {
      if (typeof cb === 'function') {
        cb(params);
        cb = null;
      }
    };
    // 用户信息
    var setUserinfo = function setUserinfo(res) {
      var userInfo = res.userInfo || (res.wxUserInfo && res.wxUserInfo.userInfo ? res.wxUserInfo.userInfo : {});
      params.openid = res.openId;
      params.nickName = userInfo.nickName;
      params.gender = userInfo.gender;
      params.city = userInfo.city;
      params.province = userInfo.province;
      params.country = userInfo.country;
      params.avatarUrl = userInfo.avatarUrl;
      // params.unionId = res.unionId;
      params.unionId = '{{ unionId }}'; // 占位符, 由后端替换成实际的unionId
      // 等待其它异步获取的信息完成, 有些不是必须等待
      setTimeout(send, 50);
    };
    if (app.$user && app.$user.openId) {
      setUserinfo(app.$user);
    } else {
      app.user().then(setUserinfo);
    }

    setTimeout(send, 700);
  }
};
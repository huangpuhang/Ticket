'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var user = require('./user');
require('./polyfill');
var $requestLimit = 4;
var $requestList = [];
var $requestingMap = {};
var $requests = [];
var DOMAIN = 'https://api.bestarcinema.yanfaba.cn';

module.exports = function (method, url, data, header) {
  if ((typeof method === 'undefined' ? 'undefined' : _typeof(method)) === 'object') {
    url = method.url;
    data = method.data;
    header = method.header;
    method = method.method;
  }
  var req = {
    method: method,
    url: url,
    header: {
      'X-Channel-ID': 40000,
      'X-Requested-With': 'wxapp'
    },
    data: {},
    query: {}
  };
  var app = getApp();
  if (app && app.$openId) {
    req.header['bestarcinema-userid'] = app.$openId;
  }else{
    req.header['bestarcinema-userid'] = wx.getStorageSync('userId');
  }
  var def = {
    config: function config(name, value) {
      if (arguments.length === 2) {
        req.options = req.options || {};
        req.options[name] = value;
      } else {
        req.options = name;
      }
      return def;
    },
    header: function header(name, value) {
      if (arguments.length === 2) req.header[name] = value;else req.header = _extends({}, req.header, name);
      return def;
    },
    query: function query(name, value) {
      if (arguments.length === 2) req.query[name] = value;else req.query = name;
      return def;
    },
    send: function send(name, value) {
      if (arguments.length === 2) {
        req.data[name] = value;
      } else {
        req.data = name;
      }
      return def;
    },
    end: function end(callback) {
      if (req.options && req.options.key) {
        if ($requestingMap[req.options.key]) return Promise.reject();
        $requestingMap[req.options.key] = true;
      }

      var p = new Promise(function (accept, reject) {
        if (!callback) {
          callback = function callback(err, res) {
            if (err) return reject(err);
            accept(res);
          };
        }
      });

      if (!req.header['content-type']) {
        if (req.method && req.method.toUpperCase() != 'GET') {
          req.header['content-type'] = 'application/x-www-form-urlencoded';
        } else {
          req.header['content-type'] = 'application/x-www-form-urlencoded';
        }
      }

      function resolveParams(obj) {
        Object.keys(obj).forEach(function (key) {
          /**
           * 删除值为undefined的项
           */
          if (typeof obj[key] === 'undefined') {
            if (key.toUpperCase() === 'TOKEN') {
              obj[key] = '';
            } else {
              delete obj[key];
            }
          }
          /**
           * 值中的对象转为json字符串
           */
          if (_typeof(obj[key]) === 'object' && req.header['content-type'] !== 'application/json') {
            try {
              obj[key] = JSON.stringify(obj[key]);
            } catch (e) {}
          }
        });
      }
      resolveParams(req.header);
      resolveParams(req.query);
      resolveParams(req.data);

      Object.keys(req.query).forEach(function (name) {
        req.url += (req.url.includes('?') ? '&' : '?') + [encodeURIComponent(name), encodeURIComponent(req.query[name])].join('=');
      });

      if (req.url.indexOf('http')) {
        req.url = DOMAIN + req.url;
      }

      var _url = req.url;
      req.timestamp = +new Date();
      req.complete = function (res) {
        // console.log(_url + ' ===>', res);
        var i = $requestList.indexOf(req);
        $requestList.splice(i, 1);
        for (i = 0; i < $requestList.length; i++) {
          var r = $requestList[i];
          if (r.status === 'pending') {
            wx.request(r);
            delete r.status;
            break;
          }
        }

        res.statusCode = res.statusCode || 0;
        var error = null;
        if (res.errMsg.includes('request:fail')) {
          error = new Error(res.errMsg);
          error.name = 'Network Error';
          error.type = 0x01;
          error.errType = 'networkError';
          error.res = res;
        }
        if (res.errMsg.includes('request:ok')) {
          var statusType = parseInt(res.statusCode / 100, 10);
          if ([4, 5].includes(statusType)) {
            error = new Error(res.errMsg);
            error.name = 'Server Error';
            error.type = 0x02;
            error.errType = 'serverError';
            error.res = res;
          } else if (res.data && res.data.error) {
            error = new Error(res.data.error.message);
            error.name = 'Internal Error';
            error.type = 0x03;
            error.errType = 'otherError';
            error.res = res;

            if ([401, 4001].includes(res.data.error.code)) {
              user.logout();
            }
          } else {
            var currentPage = getCurrentPages().slice(-1)[0];
            currentPage && currentPage.hideErrorPage();
          }
        }
        if (req.options) {
          if (req.options.loading) {
            wx.hideToast();
          }
          if (req.options.barLoading) {
            wx.hideNavigationBarLoading();
          }
        }
        var response = {
          request: req,
          timestamp: +new Date(),
          body: res.data,
          statusCode: parseInt(res.statusCode, 10)
        };
        callback && callback(error, response);
        if (req.options && req.options.key) {
          setTimeout(function () {
            delete $requestingMap[req.options.key];
          }, 100);
        }
        wx.stopPullDownRefresh();
      };
      if (req.options) {
        if (req.options.loading) {
          wx.showToast({
            icon: 'loading',
            title: '加载中...',
            duration: 10000
          });
        }
        if (req.options.barLoading) {
          wx.showNavigationBarLoading();
        }
      }

      $requestList.push(req);
      if ($requestList.length > $requestLimit) {
        req.status = 'pending';
      } else {
        wx.request(req);
      }
      // 调试分析
      if ($requests > 100) $requests.clear();
      $requests.push(req);
      return p;
    }
  };
  // define short method
  'get post put delete'.split(' ').forEach(function (subMethod) {
    def[subMethod] = function () {
      return function (subUrl) {
        req.url = req.url || subUrl;
        req.method = (req.method || subMethod).toUpperCase();
        return def;
      };
    }();
  });
  return def;
};
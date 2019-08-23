'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var stats = require('./scripts/stats.js');
require('./scripts/polyfill');
var locationUtil = require('./scripts/location.js');
var promisify = require('./scripts/promisify');
var store = require('./scripts/store');
var attach = require('./scripts/attach');
var user = require('./scripts/user');
var request = require('./scripts/request');
var MoviePage = require('./scripts/page');

var locationModel = require('./models/location');
var cityModel = require('./models/city');
var config = require('./config/wxapp');

//promise
Promise = require('./scripts/promise');

var app = {
  /**
   * [onLaunch description]
   * @return {[type]} [description]
   */
  onShow: function(e){
    if (e.scene == 1038 && e.referrerInfo && e.referrerInfo.appId == 'wx224d6de07f908e3d') {
      var extraData = e.referrerInfo.extraData;
      if (extraData.orderid) {
        wx.redirectTo({
          url: './orderdraw?ticketOrderId=' + extraData.orderid
        });
      }
    }
  },
  onLaunch: function onLaunch(options) {
    var _this = this;

    this.channelId = 40000; // 渠道id，1:猫眼app
    locationUtil.app = this;
    var storeCity = wx.getStorageSync('_city');
    this.$location = {
      city: storeCity ? storeCity : {
        id: 320500, //110100,
        nm: '苏州市' //"北京市"
      }
    };
    app.locationCity = {
      id: 320500, //110100,
      nm: '苏州市' //"北京市"
    };
    this.$user = {};
    this.diyMovie = {};
    // $debug的值在构建时通过NODE_ENV决定
    this.$debug = !!'true';
    this.$theme = '';
    this.appId = 'wx39d663257bcde274';
    this.showRed = true;
    this.uuid();
    setTimeout(function () {
      _this.user();
      _this.systemInfo();
    }, 0);

    var props = {
      val_cid: 'app'
    };

    this.clearOutdate();

    locationModel.on('change', function (location) {
      _this._cityToastDisabled = true;
      Object.assign(_this.$location, location);
    });
    cityModel.on('change', function (city) {
      _this.$location.locationCity = city;
    });

    this.models = {
      location: locationModel,
      city: cityModel
    };

    var cacheCity = store.get('city');
    if (cacheCity) {
      this.$location.city = cacheCity;
    }

    this.store = store;
  },
  stats: function stats() {},
  num: function num(n) {
    if (n > 1e4) {
      n /= 1e4;
      n = n.toFixed(1) + '万';
    }
    return n;
  },
  system: function system(done) {
    if (typeof done === 'function') {
      this.wx2callback(wx.getSystemInfo)(done);
    } else {
      try {
        return wx.getSystemInfoSync();
      } catch (e) {
        console.error('app.system', e);
      }
    }
  },
  goto: function goto(url) {
    var pages = this.pages();
    if (url === -1) {
      wx.navigateBack();
    } else {
      var gotoFn = wx.navigateTo;
      if (pages.length > 5) {
        gotoFn = wx.redirectTo;
        url = url + (url.includes('?') ? '&' : '?') + '_redirect=1';
      }
      gotoFn({ url: url });
    }
    return this;
  },

  /**
   * 检验是否登录
   * 如果登录了就直接调用回调函数fn
   * 没登录就跳转到登录页登录，登录完成会继续执行回调函数fn
   */
  checkLogin: function checkLogin(success, fail) {
    var warn = '';
    var path = '';
    if (typeof success !== 'function') {
      fail = success.fail;
      warn = success.warn;
      path = success.path;
      success = success.success;
    }

    var page = this.page();

    function gotoLogin() {
      var currentPath = '';
      if (this.pages().length === 5) {
        var queryStringify = this.queryStringify(page._options);
        currentPath = '/' + page.route + '?' + queryStringify;
        this._page5 = true;
      }

      this.goto('/pages/user/login?' + this.queryStringify({
        warn: warn,
        path: path
      }));

      this._loginReturnUrl = currentPath || '/' + page.route;
      this._loginCallback = success;
    }

    this.user();
    if (!this.$user.token) {
      gotoLogin.call(this);
      fail && fail();
    } else {
      return success && success.call(page);
    }
  },

  /**
   * 检验是否登录
   * 如果登录了就直接调用回调函数success
   * 没登录就直接调用回调函数fail
   */
  isLogin: function isLogin(success, fail) {
    this.user();
    if (!this.$user.token) {
      return fail && fail();
    } else {
      return success && success();
    }
  },

  /**
   * 检验有定位权限
   */
  checkLocationAuth: function checkLocationAuth() {
    var _this2 = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        modalOpt = _ref.modalOpt,
        silence = _ref.silence;

    if (!wx.getSetting) {
      return Promise.resolve(true);
    }

    // wx.getSetting断网情况下特别慢，所以添加断网检测
    return new Promise(function (resolve, reject) {
      _this2.wx2promiseify(wx.getNetworkType).then(function (res) {
        if (res.networkType === 'none') {
          resolve(true);
        }
      }).catch(function (err) {
        return reject(err);
      });

      _this2.wx2promiseify(wx.getSetting).then(function (res) {
        if (res.authSetting) {
          var auth = res.authSetting['scope.userLocation'];

          if (silence) {
            if (auth === true) {
              return true;
            }
            throw Error('用户未授权定位');
          }

          if (auth !== false) {
            return true;
          }
        }

        if (silence) {
          throw Error('用户拒绝打开定位');
        }

        return _this2.wx2promiseify(wx.showModal, _extends({
          content: '需要先授权定位才可获取您的位置信息',
          showCancel: true,
          confirmText: '打开定位'
        }, modalOpt || {})).then(function (subRes) {
          if (subRes.confirm) {
            return _this2.wx2promiseify(wx.openSetting);
          }
          throw Error('用户拒绝打开定位');
        }).then(function (subRes) {
          if (subRes.authSetting && subRes.authSetting['scope.userLocation']) {
            return true;
          }

          throw Error('获取定位授权失败');
        });
      }).then(function (res) {
        return resolve(res);
      }).catch(function (err) {
        return reject(err);
      });
    });
  },

  /**
   * 将分数值转换成数组
   */
  star: function star(score) {
    var scoreArray = [];
    while (scoreArray.length < parseInt(score, 10)) {
      scoreArray.push('full');
    }if (score > parseInt(score, 10)) scoreArray.push('half');
    while (scoreArray.length < 5) {
      scoreArray.push('empty');
    }return scoreArray;
  },
  queryStringify: function queryStringify(obj) {
    if (!obj) {
      return '';
    }

    return Object.keys(obj).map(function (key) {
      var value = obj[key] ? encodeURIComponent(obj[key]) : '';
      return key + '=' + value;
    }).join('&');
  },

  /**
   * 分享时的附加信息，拼接在分享路径的后面
   * @param options(Object)
   * @returns {*}
   */
  shareParams: function shareParams() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var params = {
      utm_source: 'share_wxapp' // 微信小程序
    };

    params = _extends({}, params, options);

    return this.queryStringify(params);
  },

  /**
   * 获取当前页面栈
   */
  pages: function pages() {
    return getCurrentPages();
  },

  /**
   * 获取当前页面对象
   */
  page: function page(index) {
    var pages = this.pages();
    index = index || -1;
    if (index < 0) {
      index = pages.length + index;
    }
    return pages[index];
  },

  /**
   * get or set navbar title
   */
  title: function title(_title) {
    if (typeof _title === 'string') {
      this.$title = _title;
      return this.wx2promiseify(wx.setNavigationBarTitle, { title: _title });
    }
    return this.$title;
  },

  /**
   * get network type
   */
  network: function network(done) {
    if (typeof done === 'function') {
      return this.wx2callback(wx.getNetworkType)(function (err, res) {
        done(err, res.networkType);
      });
    }
    return this.wx2promiseify(wx.getNetworkType).then(function (network) {
      return network.networkType;
    });
  },

  /**
   * require local library
   */
  require: function (_require) {
    function require(_x3) {
      return _require.apply(this, arguments);
    }

    require.toString = function () {
      return _require.toString();
    };

    return require;
  }(function (name) {
    return require('./' + name);
  }),

  /**
   * [uuid description]
   * @return {[type]} [description]
   */
  uuid: function uuid(callback) {
    var _this3 = this;

    return new Promise(function (accept, reject) {
      if (_this3.$uuid) {
        callback && callback(_this3.$uuid);
        return accept(_this3.$uuid);
      }
      _this3.$uuid = store.get('uuid');
      if (_this3.$uuid) {
        callback && callback(_this3.$uuid);
        return accept(_this3.$uuid);
      }
      _this3.request().post('/hostproxy/uuid/v1/register').header('x-host', 'http://apimobile.vip.sankuai.com').end().then(function (res) {
        return res.body.uuid;
      }).then(function (uuid) {
        if (uuid) {
          accept(uuid);
          store.set('uuid', _this3.$uuid = uuid);
          callback && callback(null, uuid);
        } else {
          reject(uuid);
          callback && callback(uuid);
        }
      }).catch(reject);
    });
  },
  systemInfo: function systemInfo() {
    var _this4 = this;

    if (this.$systemInfo) {
      return Promise.resolve(this.$systemInfo);
    }
    return this.wx2promiseify(wx.getSystemInfo).then(function (res) {
      _this4.$systemInfo = res;
      return res;
    });
  },
  rpx2px: function rpx2px(rpx) {
    var screenWidth = this.$systemInfo ? this.$systemInfo.screenWidth : 375;

    return rpx * screenWidth / 750;
  },
  sendMessage: function sendMessage(data) {
    if (!this.$user.openId) {
      return;
    }
    // data = {
    //   "template_id": "pKTWUWayhLFUNoqzMrWm6EF9ImUdth2WCSYyE7asYzM",
    //   "page": "index",
    //   "form_id": data.form_id,
    //   "data": {
    //       "keyword1": {
    //           "value": "影片名称",
    //           "color": "#173177"
    //       },
    //       "keyword2": {
    //           "value": "test1",
    //           "color": "#173177"
    //       },
    //   },
    // }

    this.request().post('/wechat/wxapp/message').header('content-type', 'application/json').send(_extends({
      touser: this.$user.openId
    }, data)).end();
  },

  /**
   * 距离计算函数
   */
  distance: function distance(o) {
    var l = this.$location;
    var r1 = l.latitude * Math.PI / 180;
    var r2 = o.lat * Math.PI / 180;
    var a = r1 - r2;
    var b = l.longitude * Math.PI / 180 - o.lng * Math.PI / 180;
    var s = 6378.137 * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(r1) * Math.cos(r2) * Math.pow(Math.sin(b / 2), 2)));
    o.distance = Math.round(s * 10) / 10;
    return o;
  },

  /**
   * 图片服务参数处理函数
   *
   * app.img('url ...', {
   *  w: 100,
   *  h: 100,
   *  e: 1,
   *  c: 1,
   *  ...
   * })
   *
   * app.img('url ...', 100, 100);
   */
  img: function img(src, options, h) {
    if (!src) return src;
    src = src.replace('/w.h/', '/');
    src = src.split('@')[0];

    if (typeof options === 'undefined') {
      options = {};
    }
    if (typeof options === 'number') {
      options = { w: options, h: h };
    }

    // 指定尺寸小于原图会裁剪，大于原图会返回原图，
    options = _extends({
      l: 1,
      e: 1,
      c: 1
    }, options);

    var pixelRatio = this.$systemInfo ? this.$systemInfo.pixelRatio : 2;
    options.w && (options.w = parseInt(options.w / 2 * pixelRatio, 10));
    options.h && (options.h = parseInt(options.h / 2 * pixelRatio, 10));

    if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
      src += '@';
      src += Object.keys(options).map(function (k) {
        return options[k] + k;
      }).join('_');
    }
    return src;
  },

  /**
   * 格式化价格，最多保留两位小数
   */
  price: function price(_price) {
    if (isNaN(_price)) {
      return _price;
    }
    return Number(Number(_price).toFixed(2));
  },

  /**
   * 取票码格式化，没4个空格
   */
  code: function code(_code) {
    if (!_code || !_code.length) {
      return _code;
    }

    var total = _code.length;
    var index = 0;
    var arr = [];
    while (index < total) {
      arr.push(_code.slice(index, index + 4));
      index += 4;
    }

    return arr.join(' ');
  },

  /**
   * 当前promise执行完成才允许执行下一个
   */
  noRepeatPromise: function noRepeatPromise(promiseFactory) {
    var promise = void 0;
    return function () {
      function end() {
        promise = null;
      }

      if (promise) {
        return promise;
      }

      for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      promise = promiseFactory.apply(this, params);

      if (promise && promise.then) {
        promise.then(end, end);
      } else {
        promise = null;
      }

      setTimeout(function () {
        promise = null;
      }, 10 * 1000);
    };
  },

  /**
   * wx2promiseify
   */
  wx2promiseify: promisify.wx2promise,
  request: request,
  /**
   * wx2callback
   */
  wx2callback: function wx2callback(fn) {
    var _this5 = this;

    return function (params, callback) {
      params = params || {};
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }
      params.success = function (d) {
        return callback(null, d);
      };
      params.fail = function (e) {
        return callback(e);
      };
      fn(params);
      return _this5;
    };
  },
  deviceInfoByQQ: function deviceInfoByQQ() {
    return JSON.stringify({
      identityInfo: {
        appid: this.appId,
        openid: this.$user ? this.$user.openId : ''
      },
      user_type: 'wx'
    });
  }
};

attach(app, store);
attach(app, user);

attach(app, {
  MoviePage: MoviePage
});

App(app);
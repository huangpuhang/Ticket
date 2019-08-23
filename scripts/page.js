'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var locationUtil = require('./location');

/**
 * 页面基类
 * 用于覆盖小程序中原生的 Page 注册函数
 * 接管注册的页面对象，对其添加属性和函数
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
function $Page(props) {
  var app = getApp();
  app.stats(props);

  var _onLoad = props.onLoad;
  props.onLoad = function (options) {
    this._options = options;
    options && Object.keys(options).forEach(function (key) {
      options[key] = decodeURIComponent(options[key]);
    });

    _onLoad && _onLoad.call(this, options);
  };

  var _onShow = props.onShow;
  props.onShow = function () {
    if (app.$location.city || !this.needCity) {
      if (app.$user.token && app._loginReturnUrl && app._loginReturnUrl.indexOf(app.page().route) === 1) {
        app._loginCallback && app._loginCallback();
        delete app._loginCallback;
        delete app._loginReturnUrl;
        delete app._page5;
      }

      if (this.delayOnLoad) {
        this.onLoad(this._options);
        delete this.delayOnLoad;
      }

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _onShow && _onShow.apply(this, args);
    } else {
      this.delayOnShow = true;
    }
  };

  var _onReady = props.onReady;
  props.onReady = function () {
    if (app.$location.city || !this.needCity) {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      _onReady && _onReady.apply(this, args);
    } else {
      this.delayOnReady = true;
    }
  };

  for (var prop in props) {
    this[prop] = props[prop];
  }
  return $Page.Page(this);
}

/**
 * Toast
 * @param  {[type]} toast
 * @param  {[type]} duration
 * @return {[type]}
 */
$Page.prototype.toast = function (toast, duration) {
  if (typeof toast !== 'string') {
    return console.error('不允许toast非字符串', toast);
  }

  var that = this;
  this.setData({ toast: toast });

  clearTimeout(this._toastTimer);
  this._toastTimer = setTimeout(function () {
    that.setData({ toast: '' });
  }, duration || 1000);
  return this;
};

$Page.prototype.dialog = function (title, content, callback) {
  var options = {};
  if ((typeof title === 'undefined' ? 'undefined' : _typeof(title)) === 'object') {
    options = title;
    title = options.title;
    content = options.content;
    callback = content;
  }
  options.title = title;
  options.content = content;
  options.complete = function (res) {
    var error = null;
    if (res.errMsg.indexOf('showModal:ok') === -1) {
      error = new Error(res.errMsg);
      error.res = res;
    }
    callback(error, res);
  };
  wx.showModal(options);
  return this;
};

/**
 * [createModal description]
 * @param  {[type]} name    [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
$Page.prototype.createModal = function (name, options) {
  var self = this;
  var data = this.data;
  var modal = {
    display: false
  };
  data[name] = modal;
  this.setData(data);
  return {
    show: function show(data) {
      var data = self.data;
      modal.display = true;
      for (var k in data) {
        modal[k] = data[k];
      }data[name] = modal;
      self.setData(data);
    },
    hide: function hide() {
      var data = self.data;
      modal.display = false;
      for (var k in data) {
        modal[k] = data[k];
      }data[name] = modal;
      self.setData(data);
    }
  };
};

$Page.prototype.onTapModalOverlay = function (e) {
  var target = e.target;
  var data = this.data;
  var modal = data[target.id];
  if (modal) {
    modal.display = false;
    data[target.id] = modal;
    this.setData(data);
  }
};

/**
 * Loading
 * @param  {[type]} isLoading
 * @return {[type]}
 */
$Page.prototype.loading = function (isLoading) {
  if (!arguments.length || isLoading) {
    wx.showToast({
      title: '努力加载中',
      icon: 'loading',
      duration: 10000
    });
  } else {
    wx.hideToast();
  }
  return this;
};

/**
 * Loading
 * @param  {[type]} isLoading
 * @return {[type]}
 */
$Page.prototype.seatLocklLoading = function (isLoading) {
  if (!arguments.length || isLoading) {
    wx.showToast({
      title: '锁座中',
      icon: 'loading',
      duration: 10000
    });
  } else {
    wx.hideToast();
  }
  return this;
};

$Page.prototype.toastError = function (message) {
  var e = new Error(message);
  e.type = 0x04; //自定义错误
  return e;
};
/**
 * [handleError description]
 * @param  {[type]} err  [description]
 * @param  {[type]} mode [description]
 * @return {[type]}      [description]
 */
$Page.prototype.handleError = function (err, mode) {
  console.error(err);
  // if error is an string or boolean object
  if (typeof err == 'boolean' || err == 'page') {
    var _ = mode;
    mode = err;
    err = _;
  }
  this.loading(null);
  // if `err` is an Error object
  if (err instanceof Error) {
    if (err.type == 0x04 || err.type == 0x03) {
      this.toast(err.message);
    } else if (mode) {
      if (!this.onPullDownRefresh) {
        this.showErrorToast(err.errType);
        setTimeout(function () {
          wx.navigateBack();
        }, 3000);
      } else {
        this.showErrorPage(err.errType);
      }
    } else if (err.errType) {
      this.showErrorToast(err.errType);
    }
  } else {
    this.toast(err);
  }
  return this;
};

/**
 * [showErrorPage description]
 * @param  {[type]} errType [description]
 * @return {[type]}         [description]
 */
$Page.prototype.showErrorPage = function (errType) {
  var errPageMap = {
    'networkError': {
      'errPage': true,
      'err_title': '数据获取失败',
      'err_content': '请检查网络后刷新'
    },
    'serverError': {
      'errPage': true,
      'err_title': '服务器异常，请稍后再试',
      'err_content': ''
    }
  };
  this.setData(errPageMap[errType]);
  return this;
};

$Page.prototype.showErrorToast = function (errType) {
  var toastMap = {
    'networkError': '网络异常, 请稍后再试',
    'serverError': '服务器异常，请稍后再试'
  };
  this.toast(toastMap[errType]);
  return this;
};
/**
 * [hideErrorPage description]
 * @return {[type]} [description]
 */
$Page.prototype.hideErrorPage = function () {
  this.setData({ errPage: false });
  return this;
};

$Page.prototype.tapRefresh = function () {
  this.loading();
  this.onPullDownRefresh();
  return this;
};

$Page.prototype.onTapNavi = function (e) {
  var _this = this;

  var app = getApp();
  var _e$currentTarget$data = e.currentTarget.dataset,
      url = _e$currentTarget$data.url,
      needLogin = _e$currentTarget$data.needLogin,
      loginWarn = _e$currentTarget$data.loginWarn,
      needCity = _e$currentTarget$data.needCity,
      val_bid = _e$currentTarget$data.val_bid,
      val_lab = _e$currentTarget$data.val_lab;


  var naviPromise = Promise.resolve(true);

  if (needCity) {
    if (!app.$location.city && !app.get('city')) {
      naviPromise = app.checkLocationAuth({
        modalOpt: {
          content: '需要先授权定位才可获取您的位置信息噢'
        }
      });
    }
  }

  if (needLogin) {
    naviPromise = naviPromise.then(function () {
      return new Promise(function (resolve, reject) {
        app.checkLogin({
          warn: loginWarn,
          path: url,
          success: function success() {
            resolve(true);
          }
        });
      });
    });
  }

  naviPromise.then(function () {
    if (val_bid) {
      _this.stats(val_bid, val_lab);
    }

    app.goto(url);
  });
};

$Page.prototype.onTapModalTrigger = function () {
  this.setData({
    licenceModalVisible: true
  });
};

$Page.prototype.licenceModalChange = function () {
  this.setData({
    licenceModalVisible: false
  });
};

/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = function (props) {
  $Page.Page = $Page.Page || Page;

  if ((typeof props === 'undefined' ? 'undefined' : _typeof(props)) === 'object') register(props);
  /**
   * [register description]
   * @param  {[type]} props [description]
   * @return {[type]}       [description]
   */
  function register(props) {
    return new $Page(props);
  }
  // only once
  return register;
};
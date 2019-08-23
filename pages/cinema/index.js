'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

var _require = require('./_cinema-item'),
    formatCinemas = _require.formatCinemas;

var searchBar = require('../search/_search-bar');

app.MoviePage(_extends({}, searchBar, {
  needCity: true,
  data: _extends({}, searchBar.data, {
    cinemas: [],
    paging: {
      hasMore: true,
      limit: 12,
      offset: 0
    }
  }),
  getCinemas: function getCinemas() {
    var _this = this;

    var add = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (!add) {
      this.data.paging.offset = 0;
    }
    var location = app.$location;
    var userInfo = app.$user;

    var requestData = {
      cityno: location.city ? location.city.id : 1
      // limit: this.data.paging.limit,
      // offset: this.data.paging.offset,
      // channelId: app.channelId,
      // userid: userInfo.userId,
    };

    if (location && location.longitude) {
      requestData.lng = location.longitude;
      requestData.lat = location.latitude;
    }

    return app.request().get('/cinema/cityCinemaList').query(requestData).end().then(function (res) {
      return res.body.data;
    }).then(function (res) {
      wx.stopPullDownRefresh();
      var cs = formatCinemas(res);
      _this.setData({
        // cinemas: add ? this.data.cinemas.concat(cs) : cs,
        cinemas: cs
        // paging: res.paging,
      });
      // this.data.paging.offset += this.data.paging.limit;
    });
  },
  onReachBottom: function onReachBottom() {
    if (this.data.cinemas.length) {
      this.getCinemas(true);
    }
  },
  onLoad: function onLoad(options) {
    wx.hideShareMenu && wx.hideShareMenu();
    this.initCity(options);
  },
  onUnload: function onUnload() {
    this.offCityEvent();
  },
  onShow: function onShow() {
    var currentCity = this.data.city || {};
    var appCity = app.$location.city;

    if (appCity) {
      wx.showShareMenu && wx.showShareMenu();
    } else {
      wx.hideShareMenu && wx.hideShareMenu();
    }

    if (!this.data.cinemas.length || currentCity.id !== appCity.id) {
      if (!this.data.cinemas.length) {
        this.loading(true);
      }

      this.onPullDownRefresh();
    }

    this.setCity(appCity);
  },
  onPullDownRefresh: function onPullDownRefresh(notCallBySystem) {
    var _this2 = this;

    this.data.paging = {
      hasMore: true,
      limit: 12,
      offset: 0
    };

    app.checkLocationAuth({ silence: true }).then(function () {
      return !_this2.data.cinemas.length && app.models.city.fetch();
    }).catch(function () {
      wx.stopPullDownRefresh();
    }).then(function (e) {
      return app.$location.city && _this2.getCinemas();
    }).catch(function (err) {
      // 主动刷新时如果断网，展示错误页面
      if (!notCallBySystem && err.errType === 'networkError') {
        return _this2.handleError(err, 'page');
      }

      if (_this2.data.cinemas && _this2.data.cinemas.length !== 0) {
        _this2.handleError(err);
      } else {
        _this2.handleError(err, 'page');
      }
    }).then(function () {
      _this2.loading(false);
    });
  },
  onShareAppMessage: function onShareAppMessage() {
    var city = app.$location.city;

    var cityParams = {
      cityId: city.id,
      cityName: city.nm
    };

    return {
      title: '快来看看附近的电影院',
      path: 'pages/cinema/index?' + app.shareParams(_extends({}, this.options, cityParams))
    };
  }
}));
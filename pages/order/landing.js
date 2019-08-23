'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var app = getApp();
var PROD = true; // 是否使用线上接口
var risk = require('../../scripts/risk.js');

app.MoviePage({
  data: {
    movies: [],
    coupon: null,
    desc: '获取数据失败\n请检查网络后重试',
    hasRisk: false, // 是否被风控,
    errPage: true,
    err_title: '数据获取失败',
    err_content: '请检查网络后刷新'
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;
    risk.params(); // 预调用, 提高获取参数的速度
    app.checkLogin(function () {
      _this.getCoupon();
      _this.getTopMovies(4);
    });
  },
  onPullDownRefresh: function onPullDownRefresh() {
    var _this2 = this;

    app.checkLogin(function () {
      _this2.getCoupon();
      _this2.getTopMovies(4);
    });
  },

  // 领红包/优惠券
  getCoupon: function getCoupon() {
    var _this3 = this;

    this.loading();
    var pmsWechatRisk = new Promise(function (resolve) {
      risk.params(null, resolve);
    });
    return Promise.all([pmsWechatRisk, app.uuid()]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          wechatParams = _ref2[0],
          uuid = _ref2[1];

      var url = PROD ? '/proxy/market/wxsmall/redenvelop/draw.json' : '/proxy/api/market/wxsmall/redenvelop/draw.json';
      return app.request().post(url).header({
        token: app.$user.token,
        'x-ta': 1

      }).send({
        shareId: _this3.options.wx_share_id,
        cityId: app.$location.city ? app.$location.city.id : 1,
        channelId: 40000,
        wechatParams: wechatParams,
        uuid: uuid
      }).end();
    }).then(function (res) {
      var _res$body$data = res.body.data,
          code = _res$body$data.code,
          couponList = _res$body$data.couponList,
          desc = _res$body$data.desc;

      _this3.loading(false);
      _this3.hideErrorPage();
      _this3.setData({
        hasRisk: code === 503,
        coupon: couponList && couponList[0],
        desc: desc
      });
    }).catch(function (err) {
      _this3.loading(false);
      _this3.handleError(err, true);
    });
  },
  getTopMovies: function getTopMovies(limit) {
    var _this4 = this;

    app.request().get('/mmdb/movie/v2/list/hot.json').query({
      limit: limit,
      ct: app.$location.city.nm
    }).end().then(function (res) {
      var movies = res.body.data.hot;
      return movies.map(_this4.format);
    }).then(function (movies) {
      _this4.hideErrorPage();
      _this4.setData({
        movies: movies
      });
    });
  },
  format: function format(movie) {
    movie.img = app.img(movie.img, 157, 219);
    movie.score = parseFloat(movie.sc).toFixed(1) + '分';
    movie.wish += '人想看';
    return movie;
  }
});
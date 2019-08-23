'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

var _app$require = app.require('scripts/movie'),
    populars = _app$require.populars,
    version = _app$require.version,
    get_bonus = _app$require.get_bonus;

var _app$require2 = app.require('scripts/banner'),
    banner = _app$require2.banner;
// const pop = require('./_popularize');


var red = require('./_red');
var locationUtil = require('../../scripts/location');
var locationModel = require('../../models/location');
var cityModel = require('../../models/city');
var store = require('../../scripts/store');
var searchBar = require('../search/_search-bar');
var loginScript = require('../../scripts/login');
var checkMall = require('../../scripts/check-mall');

app.MoviePage(_extends({}, searchBar, {
  needCity: true,
  data: _extends({}, searchBar.data, {
    poped: false,
    showRed: false,
    activeTab: 'hot',
    mostExpected: [], // 最受期待电影列表
    coming: [], // 待映电影
    movieIds: [], // 待映电影id
    userId: 0,
    advertisementType5: {},
    advertisementTypeId6: {},
    showSearchBar: false,
    focus: false,
    mallName: ''
  }),
  onLoad: function onLoad(options) {
    var _this = this;
    //检查附近的吾悦广场
    checkMall.checkMallIdOnIndex(options.mallId, function (mallInfo) {
      app.$location.city = _extends(app.$location.city,mallInfo);
      _this.setCity(app.$location.city);
      _this.setData({mallName:wx.getStorageSync('mallInfo').name});
    });

    // console.log(app.$user);
    if (!app.showRed) {
      red.hide.call(this);
      this.initCity(this.options);
      return;
    }
    this.options = options;
    this.hasSource = !!options.utm_source;
    this.initCity(options);
    wx.hideShareMenu && wx.hideShareMenu();
    // pop.init.call(this);
    var wxParamData = this.getWidgetParam('wxParamData', options);

    // jump to redenvelop
    if (options.activity_flag || wxParamData && wxParamData.activity_flag) {
      app.isLogin(function () {
        var user = app.$user || {};
        var token = user.token,
            userId = user.userId;


        get_bonus(token).then(function (res) {
          var hadDrawn = res && res.hadDrawn;
          if (!hadDrawn) {
            //没抢过,显示弹窗
            red.show.call(_this);
            _this.setData({
              userId: userId
            });
          } else {
            _this.initCity(options);
          }
        });
      }, function () {
        red.show.call(_this);
      });
    } else {
      // this.initCity(options)
    }
  },
  srachBar: function srachBar(e) {
    var type = e.currentTarget.dataset.type;

    var showSearchBar = false;
    var focus = false;
    if (type == 'show') {
      showSearchBar = true;
      focus = true;
    }
    this.setData({
      showSearchBar: showSearchBar,
      focus: focus
    });
  },
  isEncodeJson: function isEncodeJson(str) {
    return typeof str === 'string' && str.trim()[0] === '%';
  },
  getWidgetParam: function getWidgetParam(paramName, data) {
    if (paramName === 'query') {
      if ('wxSearchQuery' in data) {
        return decodeURIComponent(data.wxSearchQuery);
      }
      return data.query;
    }
    if (!data[paramName]) {
      return;
    }
    if (paramName === 'widgetData' || paramName === 'wxParamData' || paramName === 'data') {
      if (this.isEncodeJson(data[paramName])) {
        return JSON.parse(decodeURIComponent(data[paramName]));
      } else {
        return JSON.parse(data[paramName]);
      }
    }
  },
  onUnload: function onUnload() {
    this.offCityEvent();
  },
  onShow: function onShow() {
    var _this2 = this;

    var currentCity = this.data.city;
    var appCity = app.$location.city;
    if (appCity) {
      wx.showShareMenu && wx.showShareMenu();

      // if (this.hasSource) {
      //   pop.show.call(this, true);
      // } else {
      //   pop.renderBar.call(this);
      // }
      loginScript.openId().then(function () {
        if (!_this2.data.movies || currentCity.id !== appCity.id) {
          if (!_this2.data.movies) {
            _this2.loading();
          }

          _this2.onPullDownRefresh();
        }

        _this2.setCity(appCity);
      });
    }
    //影院信息
    var mallName = wx.getStorageSync('mallInfo').name ? wx.getStorageSync('mallInfo').name : '';
    if (wx.getStorageSync('mallId') == 10739) {
      mallName = '昆山吾悦广场';
    }
    this.setData({ mallName: mallName });
    this.advertisement();
    this.onPullDownRefresh();
  },
  advertisement: function advertisement() {
    var _this3 = this;

    banner('1').then(function (res) {
      banner('5').then(function (res5) {
        if (res5 && res5.length > 0) {
          res5 = res5[0];
          res5.title = '';
          res5.desc = '';
          var description = res5.description.split('|');
          if (description) {
            res5.title = description[0];
            res5.desc = description[1];
          }
        }
        banner('6').then(function (res6) {
          if (res6 && res6.length > 0) {
            res6 = res6[0];
            res6.title = '';
            res6.desc = '';
            var description6 = res6.description.split('|');
            if (description6) {
              res6.title = description6[0];
              res6.desc = description6[1];
            }
          }
          _this3.setData({
            banner: res,
            advertisementType5: res5,
            advertisementType6: res6
          });
        });
      });
    });
  },


  // onTapNavi(e){
  //   const { movieId } = e.currentTarget.dataset;
  // },
  onReachBottom: function onReachBottom() {
    if (this.data.activeTab === 'hot') {
      if (this.data.movies && this.data.movies.length) {
        this.fetchMovies();
      }
    } else {
      this.data.movieIds.length > 0 && this.getMoreComingMovies();
    }
  },
  onPullDownRefresh: function onPullDownRefresh() {
    if (!app.$location.city) {
      return wx.stopPullDownRefresh();
    }
    this.fetchMovies(0);
    // if (this.hasSource) {
    //   pop.show.call(this, true);
    // } else {
    //   pop.renderBar.call(this);
    // }
    if (this.data.activeTab === 'coming') {
      // this.getMostExpectedMovies()
      this.getComingMovies();
    }
  },
  fetchMovies: function fetchMovies(offset) {
    var _this4 = this;

    var self = this;

    if (typeof offset === 'undefined') offset = this.data.offset || 0;
    if (offset === 0) {
      if (this.data.movies) {
        this.data.movies = [];
      }
      this.data.hasMore = true;
    }
    if (!this.data.hasMore) return;
    function finish() {
      self.loading(false);
      wx.stopPullDownRefresh();
    }
    populars(offset).then(function (res) {
      // var data = res.paging;
      // data.offset += data.limit;
      // data.movies = (this.data.movies || []).concat(res.hot);
      finish();
      _this4.setData({
        movies: res.data,
        displayComingSoon: res.displayComingSoon
      });
      wx.setStorage({
        key: "movies",
        data: res.data
      });
    }).catch(function (err) {
      finish();
      _this4.handleError(err, _this4.data.movies ? undefined : 'page');
    });
  },
  onShareAppMessage: function onShareAppMessage() {
    var cityParams = {
      cityId: this.data.city.id,
      cityName: this.data.city.nm,
      malId : wx.getStorageSync('mallId')
    };

    return {
      title: '最近上映的这些电影你都看了吗？',
      path: 'pages/movie/index?' + app.shareParams(_extends({}, this.options, cityParams))
    };
  },

  popRoll: function popRoll(e) {
    app.checkLogin({
      warn: '领取前请先登录',
      success: function success() {}
    });
  },
  popClose: function popClose(e) {
    // pop.hide.call(this);
  },
  popOpen: function popOpen(e) {
    // pop.show.call(this);
  },
  popShare: function popShare(e) {
    // pop.share.call(this);
  },
  popNofunc: function popNofunc(e) {},

  closeMod: function closeMod(e) {
    this.initCity(this.options);
    red.hide.call(this);
  },
  switchToHot: function switchToHot() {
    this.switchTab('hot');
  },
  switchToComing: function switchToComing() {
    this.switchTab('coming');
  },
  switchTab: function switchTab(tab) {
    if (tab === 'coming' && !this.data.mostExpected.length) {
      // this.getMostExpectedMovies()
      this.getComingMovies();
    }
    this.data.activeTab === tab || this.setData({ activeTab: tab });
  },
  getMostExpectedMovies: function getMostExpectedMovies() {
    var _this5 = this;

    this.loading(true);
    app.request().get('/movie/comingSoonList').header({
      'mallcoo-mall-id': wx.getStorageSync('mallId')
    }).query({
      cityno: this.data.city ? this.data.city.id : 1
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (data) {
      _this5.loading(false);
      wx.stopPullDownRefresh();

      data.coming.map(function (movie) {
        movie.img = app.img(movie.img, 170, 230);
        movie.date = movie.comingTitle.replace(' ', '').split('周')[0];
      });
      _this5.setData({
        mostExpected: data.coming
      });
    }).catch(function (err) {
      _this5.loading(false);
      if (_this5.data.mostExpected.length) {
        _this5.handleError(err);
      } else {
        _this5.handleError(err, 'page');
      }
    });
  },

  // 获取待映电影
  getComingMovies: function getComingMovies() {
    var _this6 = this;

    this.loading(true);

    app.request().get('/movie/comingSoonList').header({
      'mallcoo-mall-id': wx.getStorageSync('mallId')
    }).query({
      cityno: this.data.city ? this.data.city.id : 1
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (data) {
      _this6.loading(false);
      wx.stopPullDownRefresh();
      _this6.setData({
        coming: _this6.groupMoviesByDate(data, true)
      });
    }).catch(function (err) {
      _this6.loading(false);
      if (_this6.data.coming.length) {
        _this6.handleError(err);
      } else {
        _this6.handleError(err, 'page');
      }
    });
  },

  // onReachBottom 时获取更多待映电影
  getMoreComingMovies: function getMoreComingMovies() {
    var _this7 = this;

    var movieIds = this.data.movieIds;

    var cMovieIds = movieIds.slice(0, 10);

    app.request().get('/mmdb/movie/list/info.json').query({
      ci: this.data.city ? this.data.city.id : 1,
      movieIds: cMovieIds.join(',')
    }).header({
      token: app.$user.token
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (data) {
      movieIds.splice(0, 10);
      _this7.setData({
        coming: _this7.groupMoviesByDate(data.movies),
        movieIds: movieIds
      });
    }).catch(function (err) {
      _this7.handleError(err);
    });
  },
  groupMoviesByDate: function groupMoviesByDate(movies, isRefresh) {
    // let coming = isRefresh ? [] : this.data.coming;
    // let index = coming.length - 1;

    movies.map(function (movie) {
      movie.version = version(movie.version);
      // movie.img = app.img(movie.img, 128, 180);
      movie.showInfo = '';
      movie.showTimeInfo = '';
      movie.score = parseFloat(movie.score).toFixed(1);
    });

    return movies;
  },


  // 在待映页的纵向列表点击想看按钮
  toggleWishFromComing: function toggleWishFromComing(e) {
    this.toggleWishStatus(e);
  },

  // 在待映页的横向列表点击想看按钮
  toggleWishFromMostExpected: function toggleWishFromMostExpected(e) {
    this.toggleWishStatus(e);
  },
  toggleWishStatus: function toggleWishStatus(e) {
    var _this8 = this;

    var _e$currentTarget$data = e.currentTarget.dataset,
        wishst = _e$currentTarget$data.wishst,
        movieid = _e$currentTarget$data.movieid,
        index = _e$currentTarget$data.index,
        subindex = _e$currentTarget$data.subindex;
    var _data = this.data,
        mostExpected = _data.mostExpected,
        coming = _data.coming;


    app.checkLogin({
      warn: '添加想看前请先登录',
      success: function success() {
        var BUSINESS_TYPE = {
          MAOYAN: 1,
          MEITUAN: 2
        };
        var data = {
          userId: app.$user.id,
          token: app.$user.token,
          type: wishst ^ 1,
          business: BUSINESS_TYPE.MEITUAN,
          clientType: 'touch'
        };
        var method = data.type ? 'post' : 'delete';
        var toastText = data.type ? '已标记想看' : '已取消想看';
        app.request(method, '/hostproxy/mmdb/user/movie/' + movieid + '/wish.json').send(method === 'post' ? data : {}).end().then(function (res) {
          return res.body.data.id;
        }).then(function (id) {
          if (id === movieid) {
            var tmp = void 0;
            if (subindex !== undefined) {
              tmp = coming[index].movies[subindex];
            } else {
              tmp = mostExpected[index];
            }
            tmp.wishst = data.type;
            data.type ? tmp.wish++ : tmp.wish--;
            _this8.setData({ coming: coming, mostExpected: mostExpected });

            wx.hideToast();
            wx.showToast({
              title: toastText,
              icon: 'success',
              duration: 1000
            });
          }
        }).catch(function (err) {
          _this8.handleError(err);
        });
      }
    });
  }
}));
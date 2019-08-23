'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();
var Date2 = require('../../scripts/date2.js');
var searchBar = require('../search/_search-bar');
var util = require('../../scripts/util.js');
var checkMall = require('../../scripts/check-mall');

var defaultPaging = {
  offset: 0,
  limit: 10,
  hasMore: true
};

app.MoviePage(_extends({}, searchBar, {
  needCity: true,
  data: _extends({}, searchBar.data, {
    movie: {},
    dates: undefined,
    cinemas: null,
    day: null,
    cinemasMap: {},
    pagingMap: {},
    paging: defaultPaging,
    sortText: '按距离排序',
    sortType: 0,
    isSort: false
  }),
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;
    this.movieId = options.movieId;
    checkMall.checkMallId(options.mallId, 0);

    if (app._forceMovieCinemaLocate) {
      app.checkLocationAuth().catch(function () {}).then(function () {
        _this.initCity(options);
      });
      delete app._forceMovieCinemaLocate;
    } else {
      if(options.fromShare && options.fromShare == 1){
        _this.shareCity = options.cityId;
        _this.mallId = options.mallId;
        wx.setStorageSync('mallId', options.mallId);
        this.initCity(options);
      }
    }

    wx.hideShareMenu && wx.hideShareMenu();
  },
  onUnload: function onUnload() {
    this.offCityEvent();
  },
  onShow: function onShow() {
    var currentCity = this.data.city;
    var appCity = app.$location.city;

    if (appCity) {
      wx.showShareMenu && wx.showShareMenu();
      if (!this.data.cinemas || currentCity.id !== appCity.id) {
        this.loading(true);
        this.onPullDownRefresh();
      }
      this.setCity(appCity);
    } else {
      wx.hideShareMenu && wx.hideShareMenu();
    }
  },
  dayChangeHandler: function dayChangeHandler(e) {
    var day = e.currentTarget.dataset.date;
    this.setData({
      day: day
    });
    if (!this.data.cinemasMap[day]) {
      this.loading(true);
      this.getCinemas(false);
    }
  },
  formatMovie: function formatMovie(movie) {
    movie.img = app.img(movie.img, 220, 300);
    movie['3d'] = /3D/.test(movie.ver);
    movie['imax'] = /IMAX/.test(movie.ver);
    if (movie.sc) {
      var a = parseInt(movie.sc + 0.5, 10);
      movie.starArray = [];
      while (movie.starArray.length < parseInt(a / 2, 10)) {
        movie.starArray.push('full');
      }
      if (a % 2 === 1) {
        movie.starArray.push('half');
      }
      while (movie.starArray.length < 5) {
        movie.starArray.push('empty');
      }
      movie.sc = movie.sc.toFixed(1);
    }
    return movie;
  },
  getShowDates: function getShowDates(cb) {
    var _this2 = this;

    var location = app.$location;
    var userInfo = app.$user;

    app.request().get('/hostproxy/mmcs/show/v1/movie/showdays.json').query({
      // cityId: location.city ? location.city.id : 1,
      cityId: _this2.shareCity ? _this2.shareCity : location.city.id,
      movieId: this.movieId,
      channelId: app.channelId
    }).header({
      token: userInfo.token
    }).end().then(function (res) {
      try {
        if (res.statusCode === 200 && res.body.data) {
          var dates = res.body.data.dates;

          var days = dates.map(function (date) {
            return date.date;
          });
          var day = _this2.options.day;


          var index = days.indexOf(day);
          if (index === -1) {
            day = days[0];
            index = 0;
          }

          _this2.setData({
            dates: _this2.formatDates(dates),
            day: day,
            dateScrollLeft: app.rpx2px(index * 190)
          });
          cb();
        }
      } catch (e) {
        console.error(e);
      }
    });
  },
  getCinemas: function getCinemas() {
    var _this3 = this;

    var loading = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var isAdd = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var _data = this.data,
        day = _data.day,
        pagingMap = _data.pagingMap,
        sortType = _data.sortType;

    var location = app.$location;
    var userInfo = app.$user;

    var paging = pagingMap[day] || defaultPaging;

    if (!isAdd) {
      paging = defaultPaging;
      // this.loading(loading);
    }
    var mallId = _this3.mallId ? _this3.mallId : wx.getStorageSync('mallId');
    var requestData = {
      // ci: location.city ? location.city.id : 1,
      // cityId: location.city ? location.city.id : 1,
      // movieId: this.movieId,
      // channelId: app.channelId,
      // showDate: day,
      // offset: paging.offset,
      // limit: paging.limit,
      // userid: userInfo.userId,
      // utm_term: 7.5, // 不传这两个参数不会返回常去
      // client: 'iphone',

      // cityno: location.city ? location.city.id : 110100,
      cityno: _this3.shareCity ? _this3.shareCity : location.city.id,
      movie_no: this.movieId,
      longitude: app.$location.longitude,
      latitude: app.$location.latitude,
      date: this.data.day ? this.data.day : '',
      sortType: sortType

      // if (location && location.latitude) {
      //   requestData.lng = location.longitude
      //   requestData.lat = location.latitude
      // }
      // const _data = {"code":0,"data":{"cinemas":[{"addr":"昌平区鼓楼南大街6号佳莲时代广场4楼（近鼓楼西街）","cityId":1,"dis":384.9707138169733,"distance":"0.4km","follow":0,"id":50,"labels":[{"color":"#ff9900","name":"小吃"}],"lat":40.223534,"lng":116.23402,"mark":0,"nm":"昌平保利影剧院(佳莲时代广场店)","poiId":361208,"price":43,"promotion":{},"referencePrice":"80","score":629.0323,"sellPrice":"43","shopId":4232147,"showTimes":"11:30 | 15:45 | 18:15","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1}},{"addr":"昌平区南环路10号院1号楼悦荟万科广场8层","cityId":1,"dis":1202.6730794969492,"distance":"1.2km","follow":0,"id":8186,"labels":[{"color":"#ff9900","name":"小吃"}],"lat":40.2124,"lng":116.24026,"mark":0,"nm":"首都电影院(悦荟万科广场店)","poiId":373237,"price":49,"promotion":{},"referencePrice":"0","score":780.30304,"sellPrice":"49","shopId":4620828,"showTimes":"11:30 | 14:00 | 15:35","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1}},{"addr":"昌平区昌崔路203号果岭假日广场四楼","cityId":1,"dis":2844.8712862969123,"distance":"2.8km","follow":0,"id":66,"labels":[{"color":"#ff9900","name":"小吃"},{"color":"#ff9900","name":"折扣卡"}],"lat":40.222176,"lng":116.264755,"mark":0,"nm":"大地影院(昌平菓岭店)","poiId":1432377,"price":43.9,"promotion":{"cardPromotionTag":"限时¥19.9促销开卡，首单更优惠"},"referencePrice":"40","score":571.4286,"sellPrice":"43.9","shopId":4510749,"showTimes":"09:50 | 12:20 | 14:50","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1,"vipTag":"折扣卡"}},{"addr":"昌平区北清路1号永旺国际商城3楼","cityId":1,"dis":14538.20363437903,"distance":"14.5km","follow":0,"id":107,"labels":[{"color":"#ff9900","name":"小吃"},{"color":"#ff9900","name":"折扣卡"},{"color":"#579daf","name":"DTS:X 临境音厅","url":""}],"lat":40.09749,"lng":116.28857,"mark":0,"nm":"中影国际影城(昌平永旺店)","poiId":82598,"price":44,"promotion":{"cardPromotionTag":"开卡特惠，首单2张立减16元"},"referencePrice":"23","score":730.97345,"sellPrice":"44","shopId":3463180,"showTimes":"11:10 | 11:55 | 13:45","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallType":["DTS:X 临境音厅"],"hallTypeVOList":[{"name":"DTS:X 临境音厅","url":""}],"sell":1,"snack":1,"vipTag":"折扣卡"}},{"addr":"昌平区北七家镇温都水城广场4-5层","cityId":1,"dis":17546.611289942466,"distance":"17.5km","follow":0,"id":25016,"labels":[{"color":"#ff9900","name":"小吃"}],"lat":40.10411,"lng":116.370514,"mark":0,"nm":"中影星美国际影城(温都水城店)","poiId":165628212,"price":53,"promotion":{},"referencePrice":"0","score":600,"sellPrice":"53","shopId":98654863,"showTimes":"10:20 | 12:45 | 15:10","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1}},{"addr":"昌平区回龙观镇西大街111号三层F3-90","cityId":1,"dis":17657.892229816694,"distance":"17.7km","follow":0,"id":25346,"labels":[{"color":"#ff9900","name":"小吃"}],"lat":40.076687,"lng":116.31893,"mark":0,"nm":"华联影院(回龙观店)","poiId":175463726,"price":43,"promotion":{},"referencePrice":"0","score":600,"sellPrice":"43","shopId":108306020,"showTimes":"10:00 | 12:35 | 15:05","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1}},{"addr":"昌平区回龙观同成街华联购物中心四楼（城铁回龙观站出口对面）","cityId":1,"dis":18823.384272446277,"distance":"18.8km","follow":0,"id":9647,"labels":[{"color":"#ff9900","name":"小吃"},{"color":"#579daf","name":"杜比全景声厅","url":""}],"lat":40.071976,"lng":116.33717,"mark":0,"nm":"沃美影城(回龙观店)","poiId":4058821,"price":44,"promotion":{},"referencePrice":"0","score":600,"sellPrice":"44","shopId":18049661,"showTimes":"09:40 | 10:10 | 12:10","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallType":["杜比全景声厅"],"hallTypeVOList":[{"name":"杜比全景声厅","url":""}],"sell":1,"snack":1}},{"addr":"昌平区黄平路19号院3号楼龙旗广场购物中心3层（地铁8号线育新站路北600米，近永辉超市）","cityId":1,"dis":19739.927291513475,"distance":"19.7km","follow":0,"id":5502,"labels":[{"color":"#ff9900","name":"小吃"},{"color":"#579daf","name":"4K厅","url":""}],"lat":40.066605,"lng":116.34672,"mark":0,"nm":"保利国际影城(龙旗广场店)","poiId":3320660,"price":44,"promotion":{},"referencePrice":"100","score":753.6082,"sellPrice":"44","shopId":7999526,"showTimes":"10:05 | 12:30 | 15:00","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallType":["4K厅"],"hallTypeVOList":[{"name":"4K厅","url":""}],"sell":1,"snack":1}},{"addr":"海淀区温泉镇北部文化中心D座","cityId":1,"dis":20131.844685276777,"distance":"20.1km","follow":0,"id":16285,"labels":[{"color":"#ff9900","name":"折扣卡"},{"color":"#579daf","name":"杜比全景声厅","url":""}],"lat":40.042526,"lng":116.18892,"mark":0,"nm":"耀莱成龙国际影城(温泉镇店)","poiId":116256540,"price":43,"promotion":{"cardPromotionTag":"开卡特惠，首单2张立减10元"},"referencePrice":"0","score":745.8334,"sellPrice":"43","shopId":69509274,"showTimes":"12:00 | 14:30 | 17:00","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallType":["杜比全景声厅"],"hallTypeVOList":[{"name":"杜比全景声厅","url":""}],"sell":1,"snack":0,"vipTag":"折扣卡"}},{"addr":"海淀区西三旗建材城中路6号新都购物广场1层","cityId":1,"dis":21259.68371913868,"distance":"21.3km","follow":0,"id":58,"labels":[{"color":"#ff9900","name":"小吃"}],"lat":40.059208,"lng":116.3653,"mark":0,"nm":"金逸影城(新都店)","poiId":1549060,"price":45,"promotion":{},"referencePrice":"60","score":591.95404,"sellPrice":"45","shopId":4519054,"showTimes":"10:30 | 12:55 | 15:20","tag":{"allowRefund":0,"buyout":0,"cityCardTag":0,"deal":0,"endorse":0,"hallTypeVOList":[],"sell":1,"snack":1}}],"ct_pois":[{"ct_poi":"936879945111165696_a50_c0","poiid":361208},{"ct_poi":"936879945111165696_a8186_c1","poiid":373237},{"ct_poi":"936879945111165696_a66_c2","poiid":1432377},{"ct_poi":"936879945111165696_a107_c3","poiid":82598},{"ct_poi":"936879945111165696_a25016_c4","poiid":165628212},{"ct_poi":"936879945111165696_a25346_c5","poiid":175463726},{"ct_poi":"936879945111165696_a9647_c6","poiid":4058821},{"ct_poi":"936879945111165696_a5502_c7","poiid":3320660},{"ct_poi":"936879945111165696_a16285_c8","poiid":116256540},{"ct_poi":"936879945111165696_a58_c9","poiid":1549060}],"paging":{"hasMore":true,"limit":10,"offset":0,"total":197}},"success":true}
      // const newCinemas = this.formatCinemas(_data.data.cinemas)
      // this.setData({
      //   cinemas: newCinemas
      // });
      // return
    };
    console.log('mallId',mallId);
    console.log('requestData',requestData);
    app.request().get('/cinema/cityMovieCinemaList').header({
      'mallcoo-mall-id': mallId
    }).query(requestData).end().then(function (res) {
      try {
        _this3.loading(false);
        if (res.body.code === 0 && res.body.data) {
          console.log(res);
          var _res$body$data = res.body.data,
              cinemaEntities = _res$body$data.cinemaEntities,
              dateList = _res$body$data.dateList;


          var _day = _this3.data.day ? _this3.data.day : util._formatDate(new Date());

          var index = dateList.indexOf(_day);
          if (index === -1) {
            _day = dateList[0];
            index = 0;
          }
          _this3.setData({
            cinemas: cinemaEntities,
            dates: _this3.formatDates(dateList),
            day: _day,
            dateScrollLeft: app.rpx2px(index * 190)
          });
        }
      } catch (err) {
        _this3.handleError(err);
      }
    }).catch(function (err) {
      _this3.handleError(err);
    });
  },
  getShows: function getShows(cinema) {
    var _this4 = this;

    var location = app.$location;
    var userInfo = app.$user;

    app.request().get('/hostproxy/show/v6/collect/cinema/movieshows/' + this.movieId + '.json').send({
      channelId: app.channelId,
      dt: this.data.day,
      cinema_id: cinema.id
    }).header({
      token: userInfo.token
    }).end().then(function (res) {
      if (res.statusCode === 200 && res.body.data && res.body.data.length && res.body.data[0].plist) {
        res.body.data[0].plist.forEach(function (show) {
          show.showId = show.seqNo.substr(8);
          show.nextDay = show.dt !== _this4.data.day;
        });
        var cinemas = _this4.data.cinemas.map(function (c) {
          if (c.id === res.body.data[0].cinema_id) {
            c.plist = res.body.data[0].plist;
          }
          return _extends({}, c);
        });
        _this4.data.cinemasMap[_this4.data.day] = cinemas;
        _this4.setData({
          cinemas: cinemas
        });
      }
    });
  },
  tapShow: function tapShow(e) {
    var _e$currentTarget$data = e.currentTarget.dataset,
        day = _e$currentTarget$data.day,
        id = _e$currentTarget$data.id,
        seqno = _e$currentTarget$data.seqno,
        status = _e$currentTarget$data.status;

    if (status == 2 || status == 3) {
      return this.toast('因系统原因，该场次暂停售票，请稍后再试', 1500);
    }
    app.goto('seat?seqNo=' + seqno + '&showId=' + id + '&showDate=' + day);
  },
  formatDates: function formatDates(dates) {
    return dates.map(function (date, index) {
      return {
        isPredate: 0,
        day: date,
        text: new Date2(date).toString('EM月d日')
      };
    });
  },
  formatCinemas: function formatCinemas(cinemas) {
    var location = app.$location;
    return cinemas.map(function (cinema) {
      cinema.showPrice = !!+cinema.sellPrice; // 是否显示价格
      // if (!location.locationCity || location.city.id !== location.locationCity.id) {
      //   delete cinema.distance;
      // } else 
      if (parseFloat(cinema.distance) < 1) {
        cinema.distance = parseFloat(cinema.distance) * 1000 + 'm';
      }
      return cinema;
    });
  },
  onPullDownRefresh: function onPullDownRefresh(isLocation) {
    var _this5 = this;
    if (isLocation && isLocation == 1) {
      app.request().get('/city/currentCity').query({ longitude: app.$location.longitude, latitude: app.$location.latitude }).end().then(function (res) {
        wx.setStorageSync('mallId', res.body.data.mallId);
        _this5.mallId = res.body.data.mallId;
        _this5.shareCity = res.body.data.mallCity;
        app.request().get('/movie/movieDetail').query({ movie_no: _this5.movieId }).end().then(function (res) {
          _this5.setData({
            movie: res.body
          });
          _this5.getCinemas(false);
        })
      })
      return;
    }
    app.request().get('/movie/movieDetail').query({ movie_no: _this5.movieId }).end().then(function (res) {
      _this5.setData({
        movie: res.body
      });
      _this5.getCinemas(false);
    })
    // var movies = wx.getStorageSync("movies");
    // if (movies) {
    //   var movie = {};
    //   movies.map(function (item) {
    //     if (item.movieno == _this5.movieId) {
    //       movie = item;
    //       return;
    //     }
    //   });
    //   this.setData({
    //     movie: movie
    //   });
    //   this.getCinemas(false);
    // } else {
    //   app.request().get('/movie/movieDetail').query({ movie_no: _this5.movieId }).end().then(function (res) {
    //     _this5.setData({
    //       movie: res.body
    //     });
    //     _this5.getCinemas(false);
    //   })
    // }
  },
  onReachBottom: function onReachBottom() {
    this.getCinemas(false, true);
  },
  onShareAppMessage: function onShareAppMessage() {
    var day = this.data.day;
    var city = app.$location.city;


    var cityParams = {
      cityId: city.id,
      cityName: city.nm
    };

    // console.log('pages/cinema/movie?' + app.shareParams(_extends({}, this.options, { day: day }, cityParams)))
    var _mallId = wx.getStorageSync('mallId');
    return {
      title: '\u300A' + this.data.movie.name + '\u300B\u8D2D\u7968\u5F71\u9662',
      // desc: '猫眼小程序特惠选座，一起看电影吧',
      path: 'pages/cinema/movie?movieId='+ this.movieId +'&fromShare=1&mallId=' + _mallId + '&cityId=' + cityParams.cityId
    };
  },
  tapSort: function tapSort(e) {
    var _e$currentTarget$data2 = e.currentTarget.dataset,
        name = _e$currentTarget$data2.name,
        sorttype = _e$currentTarget$data2.sorttype,
        mask = _e$currentTarget$data2.mask;
    var sortText = this.data.sortText;

    if (mask && mask == 1) {
      this.setData({
        isSort: false
      });
      return;
    }

    if (sortText != name) {
      this.setData({
        sortText: name,
        sortType: sorttype,
        isSort: false
      });
      this.loading(true);
      this.getCinemas(false);
    }
  },
  showSort: function showSort() {
    var isSort = this.data.isSort;

    this.setData({
      isSort: isSort ? false : true
    });
  },
  tapMovieDetail: function() {
    var movieId = this.movieId;
    wx.navigateTo({
        url: './intro?movieId=' + movieId
    });
  }
}));
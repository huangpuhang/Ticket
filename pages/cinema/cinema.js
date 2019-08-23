'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var app = getApp();

var Date2 = app.require('scripts/date2');
var Finger = app.require('vendors/finger');
var modal = app.require('scripts/modal');
var util = app.require('scripts/util');
var _ = app.require('scripts/underscore.modified');
var red = require('../movie/_red');
var checkMall = require('../../scripts/check-mall');

var _app$require = app.require('scripts/movie'),
    get_bonus = _app$require.get_bonus;

app.MoviePage({
  data: {
    movie: {}, // 当前电影
    movies: [], // 所有电影
    cinema: {}, // 影院信息
    vipInfo: undefined, // 会员卡信息
    dates: [],
    show: {},
    plist: [],
    scrollLeft: 0,
    animation: false,
    dealList: [],
    preInfo: [], // 当天的优惠活动
    preDetail: {}, // 活动详请
    showPage: false, // 是否展示页面
    showRed: false,
    userId: 0,
    hiddenActiveTip: true
  },
  onLoad: function onLoad(options) {
    var _this2 = this;
    checkMall.checkMallId(options.mallId);
    this.options = options;
    var cinemaName = options.cinemaName,
        cinemaAddress = options.cinemaAddress,
        cinemaTelephone = options.cinemaTelephone,
        latitude = options.latitude,
        longitude = options.longitude,
        movieId = options.movieId,
        cinemaId = options.cinemaId;

    var _this = this;
    this.movieId = movieId;
    this.cinemaId = cinemaId;

    // this.movieName = options.movieName;
    this.data.day = options.day;

    wx.setNavigationBarTitle({
      title: cinemaName
    })

    app.systemInfo().then(function (res) {
      _this2.baseSize = app.$systemInfo.windowWidth / 375 * (app.$systemInfo.windowWidth === 375 ? 100 : 99);
      _this2.finger = new Finger({
        pressMove: function pressMove(e) {
          _this.setData({
            scrollLeft: _this.data.scrollLeft + e.deltaX,
            animation: false
          });
          if (this.timeStamp) {
            this.speed = e.deltaX / (e.timeStamp - this.timeStamp);
          }
          this.timeStamp = e.timeStamp;
        },
        touchEnd: function touchEnd(e) {
          this.speed = this.speed || 0;
          var index = parseInt(((_this.data.scrollLeft + this.speed * 60) * -1 + _this.baseSize / 2) / _this.baseSize, 10);
          this.speed = 0;
          _this.movieChange(index);
        }
      });
      modal(_this2, {
        activityListModal: {
          height: 'auto'
        },
        activityDetailModal: {
          height: 'auto'
        }
      });
      if (options.sourceOrderId) {
        // 是否是改签
        _this2.setData({
          sourceOrderId: options.sourceOrderId,
          source: options.source,
          seatCount: options.seatCount,
          movieId: _this2.movieId,
          cinemaId: _this2.cinemaId,
          cinema: {
            nm: cinemaName,
            addr: cinemaAddress,
            lat: latitude,
            lng: longitude,
            tel: cinemaTelephone
          }
        });
      }
      _this2._cinema = {
        nm: cinemaName,
        addr: cinemaAddress,
        lat: latitude,
        lng: longitude,
        tel: cinemaTelephone
      };
      _this2.loading(true);
      _this2.getMovieList();
      _this2.getCinema();
    });
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
            red.show.call(_this2);
            _this2.setData({
              userId: userId
            });
          }
        });
      }, function () {
        red.show.call(_this2);
      });
    }
  },
  makePhoneCall: function(){
    wx.makePhoneCall({
      phoneNumber: this.data.cinema.tel
    })
  },
  showActiveTipDlg: function(){
    this.setData({hiddenActiveTip:false});
  },
  hideActiveTipDlg: function(){
    this.setData({hiddenActiveTip:true});
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

  draw: function draw(e) {
    console.log('do draw');
    var user = app.$user || {};
    var token = user.token,
        userId = user.userId;

    if (token) {
      this.setData({
        userId: userId
      });
      wx.navigateTo({
        url: '/pages/redenvelop/detail'
      });
    } else {
      app.checkLogin(function () {
        console.log('login success');
      }, function () {
        console.log('login fail');
      });
    }
  },
  closeMod: function closeMod(e) {
    red.hide.call(this);
  },
  onShow: function onShow() {

    // 改签中不加载卖品列表
    if (!this.data.sourceOrderId) {
      this.getDealList();
    }
  },
  onPullDownRefresh: function onPullDownRefresh() {
    this.getMovieList();
  },
  showMap: function showMap() {
    wx.openLocation({
      latitude: +this.data.cinema.lat,
      longitude: +this.data.cinema.lng,
      name: this.data.cinema.nm,
      address: this.data.cinema.addr
    });
  },
  showActivityCell: function showActivityCell() {
    if (this.data.preInfo.length > 1) {
      this.activityListModal.show();
    } else {
      var url = this.data.preInfo[0].preInfoUrl;
      this.getPreInfoDetail(url);
    }
  },
  hideActivityListModal: function hideActivityListModal() {
    this.activityListModal.hide();
  },
  hideActivityDetailModal: function hideActivityDetailModal() {
    this.activityDetailModal.hide();
  },
  tapMovie: function tapMovie(e) {
    var index = parseInt(-1 * this.data.scrollLeft / this.baseSize + 0.5, 10);
    var offset = parseInt((e.detail.x + 60) / app.$systemInfo.windowWidth * 375 / 100, 10) - 2;
    if (offset === 0) return;
    this.movieChange(index + offset);
    this.beginScroll = false;
  },
  movieChange: function movieChange(index) {
    if (index < 0) index = 0;
    if (index > this.data.movies.length - 1) index = this.data.movies.length - 1;
    var movie = this.data.movies[index];
    this.movieId = movie.movieno;
    // const day = movie.shows[0].showDate;
    // const show = movie.shows[0];
    movie.actorArr = movie.actor.split('/');
    this.getShows();
    this.setData({
      scrollLeft: -1 * this.baseSize * index,
      animation: true,
      movie: movie
      // preInfo: show.preferential ? show.preInfo : [],
      // dates: this.formatDates(movie.shows),
      // plist: this.formatPlist(
      //   show.plist,
      //   movie.dur,
      //   day,
      // ),
      // day,
    });
  },
  getMovieList: function getMovieList() {
    var _this3 = this;

    app.request().get('/cinema/movieList').header({'mallcoo-mall-id': wx.getStorageSync('mallId')}).query({
      cinema_no: this.cinemaId
    }).end().then(function (res) {
      if (res.statusCode === 200 && res.body.code == 0) {
        var position = 0,
            movies = res.body.data,
            movie = void 0;
        if (_this3.movieId) {
          movie = _.find(movies, function (item, index) {
            position = index;
            return item.movieno == _this3.movieId;
          });
        } else {
          movie = movies[0];
          _this3.movieId = movie.movieno;
        }
        if (movie) movie.actorArr = movie.actor.split('/');
        _this3.getShows();
        _.map(movies, function (item) {
          item.tags = item.tags.split('/').slice(0, 1).join('');
        })
        _this3.setData({
          movies: movies,
          movie: movie,
          scrollLeft: -1 * _this3.baseSize * position,
          animation: true,

          movieId: _this3.movieId,
          cinemaId: _this3.cinemaId
        });
      }
    }).catch(function (err) {});
  },
  getCinema: function getCinema() {
    var userInfo = app.$user;
    var _data = { "code": 0, "data": { "addr": "昌平区回龙观镇西大街111号三层F3-90", "cinemaId": 25346, "featureTags": [{ "desc": "免押金", "tag": "3D眼镜", "type": 4 }, { "desc": "1.3以下儿童免费观影（无座、无3D眼镜），一名成人限带一名免票儿童。超过的儿童数量享受儿童票购票特惠。", "tag": "儿童优惠", "type": 7 }], "follow": 0, "lat": 40.076687, "lng": 116.31893, "nm": "华联影院(回龙观店)", "notice": "会员享受全场半价购票优惠。\n为保证您自身权益，请您勿从个人手中购买涉嫌倒卖或盗用的影票，一旦发现，影城将拒绝您入场观影。感谢您的理解与配合，祝您观影愉快！", "poiId": 175463726, "s": 6, "s1": 6, "s2": 6, "s3": 6, "sell": true, "snum": 5, "tel": "010-50954999" }, "success": true
      // const { nm,addr,lat,lng} = this.data.cinema
      // _data.data = {
      //   ..._data.data,
      //   nm: nm,
      //   addr: addr,
      //   lat: lat,
      //   lng: lng,
      // }
    };_data.data = _extends({}, _data.data, this._cinema);
    this.setData({
      cinema: _data.data
    });
    return;
  },
  getRecommendcinema: function getRecommendcinema() {
    var _this4 = this;

    var userInfo = app.$user;
    var location = app.$location;

    app.request().get('/hostproxy/mmcs/cinema/v1/recommend/cinemas.json').query({
      cityId: location.city ? location.city.id : 1,
      channelId: app.channelId,
      cinemaId: this.cinemaId
    }).header({
      token: userInfo.token,
      'x-host': 'http://maoyanapi.vip.sankuai.com'
    }).end().then(function (res) {
      if (res.statusCode === 200 && res.body.success) {
        _this4.setData({
          cinemas: res.body.data.cinemas,
          showPage: true
        });
      }
    });
  },
  getShows: function getShows() {
    var _this5 = this;

    var location = app.$location;
    var userInfo = app.$user;
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    app.request().get('/movie/schedule').header({'mallcoo-mall-id': wx.getStorageSync('mallId')}).query({
      cinema_no: this.cinemaId,
      movie_no: this.movieId
    })
    // .header({
    //   token: userInfo.token,
    //   'x-host': 'http://maoyanapi.vip.sankuai.com',
    // })
    .end().then(function (res) {

      wx.stopPullDownRefresh();
      wx.hideLoading();
      _this5.loading(false);

      if (res.statusCode === 200 && res.body.code === 0 && res.body.data.sche) {

        var movieSchedule = res.body.data,
            dates = void 0,
            firstDate = void 0,
            scheduleList = void 0,
            position = 0,
            scheduleDates = void 0,
            firstHaveDataFormatDate = void 0,
            firstHaveDataDate = void 0,
            hasPc = void 0;
        if (movieSchedule) {
          dates = Object.keys(movieSchedule.sche);

          firstDate = dates[0];
          scheduleList = movieSchedule.sche[firstDate];
          scheduleDates = util.scheduleDates(movieSchedule.sche);

          _this5.sche = movieSchedule.sche;
          hasPc = movieSchedule.pc && Object.keys(movieSchedule.pc).length > 0;

          if (movieSchedule.have_data_date) {
            firstHaveDataFormatDate = util.formateDate(movieSchedule.have_data_date);
            firstHaveDataDate = movieSchedule.have_data_date;
          }
        }
        _this5.setData({
          dates: scheduleDates,
          plist: scheduleList,
          day: firstDate,
          showPage: true
        });
        return;

        var movies = res.body.data.movies;
        var movie = movies[0];
        var index = 0;
        var today = new Date2(Date.now()).toString('yyyy-MM-dd');

        movies.forEach(function (m, i) {
          m.img = app.img(m.img, 180, 250);
          if (m.shows[0].showDate > today) {
            m.shows = [{
              hasShow: false,
              plist: [],
              showDate: today,
              preferential: 0
            }].concat(m.shows);
          }
          if (m.id === _this5.movieId) {
            movie = m;
            index = i;
          }
          m.hasScore = parseFloat(m.sc) !== 0;
        });
        var day = movie.shows[0].showDate;
        var show = movie.shows[0];
        var dayIndex = void 0;
        movie.shows.forEach(function (s, showIndex) {
          if (s.showDate === _this5.data.day) {
            show = s;
            day = _this5.data.day;
            dayIndex = showIndex;
          }
        });
        var preInfo = show.preferential ? show.preInfo : [];

        _this5.setData({
          movies: res.body.data.movies,
          movie: movie,
          vipInfo: res.body.data.vipInfo && res.body.data.vipInfo.map(function (vip) {
            vip.id = /membercard%2Fdetail%2F(\d+)%3F_v_/.exec(vip.url)[1];
            return vip;
          }),
          scrollLeft: -1 * _this5.baseSize * index,
          animation: true,
          dates: _this5.formatDates(movie.shows),
          preInfo: preInfo,
          plist: _this5.formatPlist(show.plist, movie.dur, day),
          show: show,
          day: day,
          dateScrollLeft: app.rpx2px(dayIndex * 190),
          showPage: true
        });
      }
    });
  },
  dayChangeHandler: function dayChangeHandler(e) {
    var date = e.currentTarget.dataset.date;
    var plist = this.sche[date];

    if (plist) {
      this.setData({
        plist: plist,
        day: date
      });
    }
    // this.sche.forEach(show => {
    //   if (show.showDate === e.currentTarget.dataset.date) {
    //     this.setData({
    //       day: show.showDate,
    //       show,
    //       preInfo: show.preferential ? show.preInfo : [],
    //       plist: this.formatPlist(
    //         show.plist,
    //         this.data.movie.dur,
    //         show.showDate,
    //       ),
    //     })
    //   }
    // })
  },
  formatDates: function formatDates(shows) {
    return shows.map(function (show, index) {
      return {
        day: show.showDate,
        preferential: show.preferential,
        text: new Date2(show.showDate).toString('EM月d日')
      };
    });
  },
  formatPlist: function formatPlist(plist, dur, day) {
    return plist.map(function (p) {
      var a = p.tm.split(':');
      var min = +a[1] + +dur;
      var h = +a[0] + parseInt(min / 60, 10);
      min %= 60;
      h %= 24;
      if (min < 10) min = '0' + min;
      if (h < 10) h = '0' + h;

      p.etm = h + ':' + min; // 结束时间
      p.nextDay = day !== p.dt; // 次日放映
      p.showId = +p.seqNo.slice(8);
      p.seqNo = p.seqNo;

      return p;
    });
  },
  onTapNavigator: function onTapNavigator(e) {
    var tip = e.currentTarget.dataset.tip;
    if (tip) {
      this.toast(tip, 1000);
    } else {
      this.onTapNavi(e);
    }
  },
  touchstart: function touchstart(e) {
    this.finger.start(e);
  },
  touchmove: function touchmove(e) {
    this.finger.move(e);
  },
  touchend: function touchend(e) {
    if(this.beginScroll){
      this.finger.end(e);
    }
  },
  bindscroll: function(){
    this.beginScroll = true;
  },
  touchcancel: function touchcancel(e) {
    this.finger.cancel(e);
  },
  getDealList: function getDealList() {
    var _this6 = this;

    var user = app.$user;
    var location = app.$location;
    // http://wiki.sankuai.com/pages/viewpage.action?pageId=540060409
    var _data = { "data": { "stid": "1585401697750747136", "dealList": [{ "category": 11, "dealId": 100116302, "promotionTag": null, "promotionId": 0, "price": 26.0, "firstTitle": "单人套餐A", "secondTitle": "单人套餐：32oz爆米花1桶+16oz可乐1杯", "title": "单人套餐：32oz爆米花1桶+16oz可乐1杯", "imageUrl": "http://p0.meituan.net/w.h/movie/20636ef9423f96159180f819e3341e8f66003.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 375, "recommendPersonNum": 1, "cardTag": null, "newDeal": null, "priceChange": false, "verifyBeginTime": 1530239456000, "verifyEndTime": 1561775456000, "promotionPrice": 26.0, "buyButton": 0, "titleTag": "单人", "useBeginTime": 1530239456000, "useEndTime": 1561775456000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售375", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116302?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 0, "recommendTag": null, "supportFastMeal": null, "value": 26.0 }, { "category": 11, "dealId": 100116303, "promotionTag": null, "promotionId": 0, "price": 32.5, "firstTitle": "3D单人套餐", "secondTitle": "3D单人套餐：32oz爆米花1桶+12oz果汁1杯+夹片式3D眼镜1份", "title": "3D单人套餐：32oz爆米花1桶+12oz果汁1杯+夹片式3D眼镜1份", "imageUrl": "http://p0.meituan.net/w.h/movie/3413d605d8e660e3d8376cc857780d9468215.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 14, "recommendPersonNum": 1, "cardTag": null, "newDeal": null, "priceChange": false, "verifyBeginTime": 1530239713000, "verifyEndTime": 1561775713000, "promotionPrice": 32.5, "buyButton": 0, "titleTag": "单人", "useBeginTime": 1530239713000, "useEndTime": 1561775713000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售14", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116303?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 0, "recommendTag": null, "supportFastMeal": null, "value": 36.5 }, { "category": 11, "dealId": 100116497, "promotionTag": null, "promotionId": 0, "price": 36.5, "firstTitle": "双人套餐A", "secondTitle": "双人套餐A：85oz爆米花1桶+16oz可乐2杯", "title": "双人套餐A：85oz爆米花1桶+16oz可乐2杯", "imageUrl": "http://p0.meituan.net/w.h/movie/7073d8ca06a554dbd4efa1420550513f67631.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 592, "recommendPersonNum": 2, "cardTag": "HOT", "newDeal": null, "priceChange": false, "verifyBeginTime": 1530337835000, "verifyEndTime": 1561873835000, "promotionPrice": 36.5, "buyButton": 0, "titleTag": "双人", "useBeginTime": 1530337835000, "useEndTime": 1561873835000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售592", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116497?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 2, "recommendTag": null, "supportFastMeal": null, "value": 36.5 }, { "category": 11, "dealId": 100116571, "promotionTag": null, "promotionId": 0, "price": 44.5, "firstTitle": "双人套餐B", "secondTitle": "双人套餐B:46oz爆米花1桶+46oz酷薯1份+16oz可乐2杯", "title": "双人套餐B:46oz爆米花1桶+46oz酷薯1份+16oz可乐2杯", "imageUrl": "http://p1.meituan.net/w.h/movie/17bb56f8cfed469dbafd5e8bb53a913f69800.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 64, "recommendPersonNum": 2, "cardTag": null, "newDeal": null, "priceChange": false, "verifyBeginTime": 1530452019000, "verifyEndTime": 1561988019000, "promotionPrice": 44.5, "buyButton": 0, "titleTag": "双人", "useBeginTime": 1530452019000, "useEndTime": 1561988019000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售64", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116571?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 0, "recommendTag": null, "supportFastMeal": null, "value": 50.0 }, { "category": 11, "dealId": 100116500, "promotionTag": null, "promotionId": 0, "price": 47.5, "firstTitle": "双人套餐C", "secondTitle": "46oz爆米花1桶+46oz酷薯1份+12oz果汁2杯+牛肉豆1份", "title": "46oz爆米花1桶+46oz酷薯1份+12oz果汁2杯+牛肉豆1份", "imageUrl": "http://p1.meituan.net/w.h/movie/17bb56f8cfed469dbafd5e8bb53a913f69800.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 24, "recommendPersonNum": 2, "cardTag": null, "newDeal": null, "priceChange": false, "verifyBeginTime": 1530339421000, "verifyEndTime": 1561875421000, "promotionPrice": 47.5, "buyButton": 0, "titleTag": "双人", "useBeginTime": 1530339421000, "useEndTime": 1561875421000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售24", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116500?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 0, "recommendTag": null, "supportFastMeal": null, "value": 50.0 }, { "category": 11, "dealId": 100116501, "promotionTag": null, "promotionId": 0, "price": 54.5, "firstTitle": "合家欢套餐", "secondTitle": "合家欢套餐：85oz爆米花1桶+46oz酷薯1份+牛肉豆1份+16oz可乐3杯", "title": "合家欢套餐：85oz爆米花1桶+46oz酷薯1份+牛肉豆1份+16oz可乐3杯", "imageUrl": "http://p1.meituan.net/w.h/movie/3b51ab337e004452e7aa6fbd13a057a371406.jpg@388w_388h_1e_1c", "maxNumberPerUser": 100, "maxNumberPerOrder": 100, "maxNumberPerMobile": 100, "curNumber": 45, "recommendPersonNum": 3, "cardTag": null, "newDeal": null, "priceChange": false, "verifyBeginTime": 1530339927000, "verifyEndTime": 1561875927000, "promotionPrice": 54.5, "buyButton": 0, "titleTag": "", "useBeginTime": 1530339927000, "useEndTime": 1561875927000, "promotionLogo": "", "groupDealFlag": false, "unionPromotionTag": null, "discountCardTag": "", "curNumberDesc": "已售45", "redirectUrl": "http://m.maoyan.com/deal/submitorder/100116501?_v_=yes&promotionsId=0&cinemaId=25346&category=11&poiId=0&channelId=40000", "discountCardPrice": "", "cardTagType": 0, "recommendTag": null, "supportFastMeal": null, "value": 60.0 }] }, "errCode": 1, "success": true };
    this.setData({
      dealList: _data.data.dealList.filter(function (deal) {
        return !deal.groupDealFlag;
      }).map(function (deal) {
        deal.imageUrl = app.img(deal.imageUrl, 144, 144);
        return deal;
      })
    });
    return;
    app.request().get('/hostproxy/goods/queryDealList.json').query({
      cinemaId: this.cinemaId,
      channel: 12,
      channelId: app.channelId,
      uuid: app.$uuid,
      ci: location.city ? location.city.id : 1,
      userid: user.userId
    }).header({
      token: user.token,
      'x-host': 'http://maoyanapi.vip.sankuai.com'
    }).end().then(function (res) {
      if (res.statusCode === 200 && res.body.success && res.body.data.dealList) {
        _this6.setData({
          dealList: res.body.data.dealList.filter(function (deal) {
            return !deal.groupDealFlag;
          }).map(function (deal) {
            deal.imageUrl = app.img(deal.imageUrl, 144, 144);
            return deal;
          })
        });
      }
    });
  },
  tapCell: function tapCell(e) {
    var _e$currentTarget$data = e.currentTarget.dataset,
        url = _e$currentTarget$data.url,
        tip = _e$currentTarget$data.tip,
        redirect = _e$currentTarget$data.redirect;

    if (!url) {
      this.toast(tip || '很抱歉，无法进入在线选座');
    } else {
      app.goto(url);
    }
  },
  showActDetail: function showActDetail(e) {
    var url = e.currentTarget.dataset.url;
    this.getPreInfoDetail(url);
  },
  getPreInfoDetail: function getPreInfoDetail(url) {
    var _this7 = this;

    var path = url.match(/activity\/\w+\/info/)[0];
    app.request().get('/hostproxy/' + path + '.json').header({
      'x-host': 'http://maoyantouch.vip.sankuai.com'
    }).end().then(function (res) {
      var data = res.body.data;
      data.rules = data.rule.split('<br/>');
      _this7.setData({
        preDetail: data
      });
      _this7.activityDetailModal.show();
    });
  },
  doNothing: function doNothing() {},
  onShareAppMessage: function onShareAppMessage() {
    var _data2 = this.data,
        day = _data2.day,
        movie = _data2.movie,
        _mallId = wx.getStorageSync('mallId');

    var movieId = movie.id;
    return {
      title: '这个影院还不错，快来选个场次吧',
      path: 'pages/cinema/cinema?' + app.shareParams(_extends({}, this.options, { day: day, movieId: movieId, mallId: _mallId }))
    };
  }
});
'use strict';

var locationUtil = require('../../scripts/location.js');
var locationModel = require('../../models/location');
var cityModel = require('../../models/city');

var app = getApp();
var historyCityListKey = 'historyCityList';

app.MoviePage({
  data: {
    labelMap: {
      location: '定位',
      history: '最近',
      hot: '热门'
    },
    locationCity: {
      nm: ''
    },
    // done, pending, fail
    locationStatus: 'pending',
    locationMap: {
      pending: '正在定位...',
      fail: '定位失败，请点击重试'
    },
    historyCityList: [],
    _hotCityList: [],
    letterArray: [],
    scrollTop: 0,
    hiddenMallList: true,
    mallList:[]
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.setData(options);

    this.fillHistoryCityList();

    if (options.warn) {
      this.toast(decodeURIComponent(options.warn));
    }

    Promise.all([locationUtil.getCitysFromCache(), locationUtil.getHotCitys()]).then(function (rets) {
      var citysInfo = rets[0];
      var hotCityList = rets[1];

      var letterArray = Object.keys(citysInfo.letterMap).map(function (letter) {
        return {
          letter: letter,
          list: citysInfo.letterMap[letter]
        };
      });

      _this.setData({ hotCityList: hotCityList, letterArray: letterArray });
      _this.fillNavigator();
    }).then(wx.hideToast).catch(function (err) {
      _this.handleError(err, true);
    });
  },
  onReady: function onReady() {
    if (app.$location.city && app.$location.city.nm) {
      wx.setNavigationBarTitle({
        title: '当前城市-' + app.$location.city.nm
      });
    }
  },
  onShow: function onShow() {
    this.fillLocationCity();
  },
  fillLocationCity: function fillLocationCity() {
    var _this2 = this;

    this.setData({
      locationStatus: 'pending'
    });

    cityModel.fetch(true).then(function (locationCity) {
      if (!app.$location.city) {
        app.$location.city = locationCity;
      }

      _this2.setData({
        locationCity: locationCity,
        locationStatus: 'done'
      });
    }).catch(function (err) {
      _this2.setData({
        locationStatus: 'fail'
      });
      _this2.handleError(err);
    });
  },
  onTapFillLocationCity: function onTapFillLocationCity() {
    var _this3 = this;

    app.checkLocationAuth().then(function () {
      _this3.fillLocationCity();
    });
  },
  fillHistoryCityList: function fillHistoryCityList(historyCityList) {
    historyCityList = historyCityList || app.get(historyCityListKey);
    this.setData({
      historyCityList: historyCityList
    });
  },
  selectCity: function selectCity(e) {
    var that = this;
    var cityInfo = e.target.dataset;
    if (cityInfo.id) {
      that.cityInfo = cityInfo;
      wx.getLocation({
        type: 'wgs84',
        success(location) {
          that.getMallList(location);
        },
        fail: function(res){
          that.getMallList({});
        }
      })
    }
  },
  getMallList: function (location) {
    var that = this,
        latitude = location.latitude || 1000,
        longitude = location.longitude || 1000;
    app.request().get('/city/currentMallList').query({
      cityNo: that.cityInfo.id,
      latitude: latitude,
      longitude: longitude
    }).end().then(function (res) {
      if (res.body.code == 0) {
        that.setData({
          mallList: res.body.data,
          hiddenMallList: false,
        });
      } else {
        that.chooseMall();
      }
    })
  },
  changeToCity: function changeToCity(cityInfo) {
    if (!cityInfo.id) {
      return;
    }
    app.$location.city = cityInfo;
    app.set('city', cityInfo);
    if (app.$location.locationCity && app.$location.locationCity.nm) {
      app.set('_confirm-city', app.$location.city, { expires: 12 * 60 * 60 });
    }

    var historyCityList = locationUtil.addCitys(cityInfo);
    this.fillHistoryCityList(historyCityList);
  },
  fillNavigator: function fillNavigator() {
    var ret = [];

    var location = {
      label: 'location'
    };
    ret.push(location);

    var history = {
      label: 'history'
    };
    if (this.data.historyCityList.length) {
      ret.push(history);
    }

    var hot = {
      label: 'hot'
    };
    ret.push(hot);

    this.data.letterArray.forEach(function (letterInfo) {
      ret.push({
        label: letterInfo.letter
      });
    });
    this.setData({
      navList: ret
    });
  },
  navTo: function navTo(e) {
    var id = e.currentTarget.dataset.id;
    this.setData({
      toView: id
    });
    // this.setData({
    //   toView: '',
    // })
  },
  move: function move(e) {
    var top = e.currentTarget.dataset.top;
    var clientY = e.touches[0].clientY;

    var index = Math.floor((clientY - 75) / 16);

    var nav = this.data.navList[index];

    if (nav.label === this.data.toView) {
      return;
    }

    if (nav) {
      this.setData({
        toView: nav.label
      });
    }
  },
  hideMallList: function hideMallList(){
    this.setData({hiddenMallList:true});
  },
  chooseMall: function (e) {
    var item = e ? e.currentTarget.dataset.mall : {};
    this.changeToCity(this.cityInfo);
    wx.setStorageSync('mallInfo', item);

    if (e) {
      wx.setStorageSync('mallId', item.mallId);
    } else {
      wx.setStorageSync('mallId', '');
    }

    wx.navigateBack();
    // if (this.data.next) {
    //   wx.redirectTo({ url: this.data.next });
    // } else {
    //   wx.navigateBack();
    // }
  }
});
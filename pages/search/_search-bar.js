'use strict';

var app = getApp();
var locationUtil = app.require('scripts/location');

module.exports = {
  data: {
    city: undefined,
    locationCity: undefined,
    isShowCityErrorPage: false,
    isShowOpenLocationAlertMoal: false,
    isShowUseLocationCityConfirmModal: false,
    mallDialogInfo: ''
  },
  initCity: function initCity(options) {
    var shareCity = void 0;
    if (options.cityId && options.cityName) {
      app.$location.shareCity = shareCity = {
        id: options.cityId,
        nm: options.cityName
      };
    }

    if (app.$location.shareCity) {
      this.setCity(app.$location.shareCity);
    } else {
      this.cityCache = app.store.get('city');

      if (!app.$location.city) {
        if (this.cityCache) {
          app.$location.city = this.cityCache;
        }
      }

      app.$location.city && this.setCity(app.$location.city);

      app.models.city.fetch(!app.$location.latitude);
    }

    this.onCityChange = this.onCityChange.bind(this);
    this.onCityError = this.onCityError.bind(this);
    // this.onLocationChange = this.onLocationChange.bind(this)

    app.models.city.on('change', this.onCityChange);
    app.models.city.on('error', this.onCityError);
    app.models.location.on('change', this.onLocationChange);
  },
  offCityEvent: function offCityEvent() {
    app.models.city.off('change', this.onCityChange);
    app.models.city.off('error', this.onCityError);
    app.models.location.off('change', this.onLocationChange);
  },
  setCity: function setCity(city) {
    app.$location.city = city;

    this.setData({
      city: app.$location.city,
      isShowCityErrorPage: false
    });
  },
  saveCity: function saveCity(city) {
    app.store.set('city', city);
    locationUtil.addCitys(city);
  },
  onCityChange: function onCityChange(locationCity) {
    const that = this;
    if (this !== app.page()) {
      return;
    }

    var currentCity = this.data.city;
    var mallDialogInfo = wx.getStorageSync('mallDialogInfo').name;
    this.setData({
      locationCity: locationCity,
      mallDialogInfo: mallDialogInfo
    });

    if (currentCity && currentCity.nm) {
      // 定位城市和当前城市不一致
      if (currentCity.nm !== locationCity.nm) {
        // const lastConfirmCity = app.get('_confirm-city') || {}
        // if (lastConfirmCity.nm !== currentCity.nm) {
        // this.setData({
        //   isShowUseLocationCityConfirmModal: true
        // });
        wx.showModal({
          content: '定位到您最近的广场是' + locationCity.nm + mallDialogInfo + '，是否切换至该广场？',
          confirmText: '切换',
          success: function (res) {
            if (res.confirm) {
              that.onUseLocationCity();
            } else if (res.cancel) {
              that.closeUseLocationCityConfirmModal();
            }
          }
        })
        // }
      }
    } else {
      this.setCity(locationCity);
      this.onShow();
    }
  },
  onCityError: function onCityError() {
    var _this = this;

    if (this !== app.page()) {
      return;
    }

    var currentCity = this.data.city;

    if (currentCity && currentCity.nm) {
      if (!app._cityToastDisabled) {
        this.setData({
          isShowCityToast: true
        });

        app._cityToastDisabled = true;

        setTimeout(function () {
          var animation = wx.createAnimation({
            duration: 500
          });

          _this.setData({
            cbtcAnimationHide: animation.opacity(0).step().export()
          });
          setTimeout(function () {
            _this.setData({
              isShowCityToast: false
            });
          }, 520);
        }, 2500);
      }
    } else {
      this.setData({
        isShowCityErrorPage: true
      });
      if (!app._hasGotoCityPage) {
        app.goto('/pages/citys/citys?warn=' + '定位失败，请手动选择城市');
        app._hasGotoCityPage = true;
        app._cityToastDisabled = true;
      }
    }
  },
  onLocationChange: function onLocationChange(location) {
    if (!this._location) {
      this._location = location;
      // this.onPullDownRefresh()
    }
  },
  closeOpenLocationAlertMoal: function closeOpenLocationAlertMoal() {
    this.setData({
      isShowOpenLocationAlertMoal: false
    });
  },
  closeUseLocationCityConfirmModal: function closeUseLocationCityConfirmModal() {
    this.setData({
      isShowUseLocationCityConfirmModal: false
    });

    app.set('_confirm-city', this.data.locationCity, { expires: 12 * 60 * 60 });
  },
  onUseLocationCity: function onUseLocationCity() {
    var city = this.data.locationCity;
    this.checkMallInfo(city);
    this.closeUseLocationCityConfirmModal();
    this.setCity(city);
    this.saveCity(city);
    // wx.setStorage({
    //   key: "_ctiy",
    //   data: city
    // })
    this.onPullDownRefresh && this.onPullDownRefresh(1);
  },
  checkMallInfo: function (city) {
    var that = this;
    wx.getLocation({
      type: 'wgs84',
      success(location) {
        app.request().get('/city/currentCity').query({
          latitude: location.latitude,
          longitude: location.longitude
        }).end().then(function (res) {
          var data = res.body.data;
          var mallInfo = {
            name: data.mallName,
            mallId : data.mallId
          };
          var mallName = mallInfo.name ? mallInfo.name : '';
          that.setData({ mallName: mallName });
          wx.setStorageSync('mallInfo', mallInfo);
          if(mallInfo.mallId){
            wx.setStorageSync('mallId', mallInfo.mallId);
          }
        })
      }
    })
  }
};
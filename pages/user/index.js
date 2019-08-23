'use strict';

var app = getApp();

var _app$require = app.require('scripts/banner'),
    banner = _app$require.banner;

app.MoviePage({
  data: {
    btnUser: true,
    userInfo: {},
    advertisementType4: [],
    count1: 0,
    count2: 0,
    count3: 0
  },
  onLoad: function onLoad() {
    var _this = this;

    this.userInfo = wx.getStorageSync("userInfo");
    if (this.userInfo.nickName) {
      app.$userInfo = this.userInfo;
      this.setData({
        btnUser: false,
        userInfo: this.userInfo
      });
    }
    banner('4').then(function (res) {
      console.log('banner 4 ===>', res);
      if (res && res.length > 0) {
        _this.setData({
          advertisementType4: res
        });
      }
    });
  },
  onShow: function onShow() {
    var _this2 = this;

    if (!app.$user.token) {
      this.setData({
        display: true
      });
      // return
    }

    this.getMyCards(1).then(function (coupons) {
      var num1 = 0;
      coupons.map(function (coupon) {
        num1 += coupon.amount;
      });
      _this2.getMyCards(2).then(function (num2) {
        _this2.getMyCards(3).then(function (num3) {
          _this2.setData({
            count1: num1,
            count2: num2,
            count3: num3
          });
        });
      });
    });

    // let cityId = app.$location.city ? app.$location.city.id : 1;
  },
  getMyCards: function getMyCards(goodsType) {
    return app.request().get('/user/goodsList').query({
      goodsType: goodsType
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (coupons) {
      if (coupons) {
        if (goodsType == 1) {
          return coupons;
        }
        return coupons.length;
      } else {
        return 0;
      }
    }).catch(function (err) {});
  },
  getUserInfo(){
    const that = this;
    wx.login({
      success: function(res){
        tt.getUserInfo({
          success(res){
            that.bindGetUserInfo(res.userInfo);
          },
          fail(){
            tt.openSetting({
              success(res){
                if(res.authSetting && res.authSetting['scope.userInfo']){
                  that.getUserInfo();
                }
              }
            })
          }
        })
      }
    })
  },
  bindGetUserInfo: function bindGetUserInfo(userInfo) {
    userInfo.session_key = this.userInfo.session_key;
    userInfo.openid = this.userInfo.openid;
    userInfo.sessionId = this.userInfo.sessionId;
    app.$userInfo = userInfo;
    wx.setStorage({
      key: "userInfo",
      data: userInfo
    });
    this.setData({
      btnUser: false,
      userInfo: userInfo
    });
  },
  contact: function contact() {
    wx.makePhoneCall({
      phoneNumber: '10105335'
    });
  },
  makePhoneCall: function makePhoneCall(){
    wx.makePhoneCall({
      phoneNumber: '4008-123-867'
    })
  }
});
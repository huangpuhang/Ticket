'use strict';
import date from '../../scripts/date';
var app = getApp();

app.MoviePage({
  data: {
    coupons: null,
    type: 0
  },

  onLoad: function onLoad(options) {
    var type = options.type ? parseInt(options.type) : 0;
    this.setData({
      type: type
    });
    if (type == 3) {
      wx.setNavigationBarTitle({
        title: '我的红包'
      });
    }
  },
  onShow: function onShow() {
    this.getMyCoupons();
  },
  onPullDownRefresh: function onPullDownRefresh() {
    this.getMyCoupons(true);
  },


  /**
   * 获取用户优惠券列表
   */
  getMyCoupons: function getMyCoupons(isRefresh) {
    var _this = this;

    !isRefresh && this.loading(true);
    var type = this.data.type;

    app.request().get('/user/goodsList').query({
      goodsType: type
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (coupons) {
      coupons.map(function (coupon) {
        coupon.value = coupon.amount / 100;
        coupon.type = type;
        coupon.title = coupon.goodsName;
        coupon.limitDesc = coupon.goodsDescription;
        coupon.leftDesc = coupon.validDays + '\u5929\u540E\u8FC7\u671F';
        coupon.startTime = date.fomateDate(coupon.startTimeValue);
        coupon.endTime = date.fomateDate(coupon.endTimeValue);
        return coupon;
      });
      return coupons;
    }).then(function (coupons) {
      _this.setData({
        coupons: [].concat(coupons)
      });
      _this.loading(false);
      wx.stopPullDownRefresh();
    }).catch(function (err) {
      if (_this.data.coupons) {
        _this.handleError(err);
      } else {
        _this.handleError(err, 'page');
      }
    });
  },
  addCoupons: function addCoupons() {
    wx.navigateTo({
      url: './add-coupons?type=2'
    });
  },
  tapCard: function tapCard(e) {
    var goodsid = e.currentTarget.dataset.goodsid;

    app.goto('../friends/friends?ticketOrderId=' + goodsid + '&type=2');
  }
});
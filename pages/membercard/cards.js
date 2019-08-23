'use strict';
import date from '../../scripts/date';
var app = getApp();

app.MoviePage({
  data: {
    cards: [{
      ememberCardType: 1,
      name: '观影卡'
    }]
  },
  onShow: function onShow(options) {
    this.getMyCards();
  },
  onPullDownRefresh: function onPullDownRefresh() {
    this.getMyCards(true);
  },
  getMyCards: function getMyCards(isRefresh) {
    var _this2 = this;

    var _this = this;
    var location = app.$location;
    var userInfo = app.$user;
    isRefresh || this.loading(true);
    app.request().get('/user/goodsList').query({
      goodsType: 1
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (coupons) {
      coupons.map(function (coupon) {
        coupon.value = coupon.amount / 100;
        coupon.type = 1;
        coupon.name = coupon.goodsName;
        coupon.giftSubDesc = coupon.goodsDescription;
        coupon.expireDesc = '\u4F59\u989D\uFF1A' + coupon.availableBalance / 100 + '\u5143';
        coupon.statusDesc = coupon.validDays + '\u5929\u540E\u8FC7\u671F\u6548';
        coupon.startTime = date.fomateDate(coupon.startTimeValue);
        coupon.endTime = date.fomateDate(coupon.endTimeValue);
        coupon.disable = new Date(coupon.endTime) * 1 < new Date() * 1 ? true : false;
        return coupon;
      });
      return coupons;
    }).then(function (coupons) {
      _this2.setData({
        cards: [].concat(coupons)
      });
      _this2.loading(false);
      wx.stopPullDownRefresh();
    }).catch(function (err) {
      if (_this2.data.coupons) {
        _this2.handleError(err);
      } else {
        _this2.handleError(err, 'page');
      }
    });
  },
  tapCard: function tapCard(e) {
    var goodsid = e.currentTarget.dataset.goodsid;

    app.goto('../friends/friends?ticketOrderId=' + goodsid + '&type=1');
    // app.goto(`index?eMemberCardId=${e.currentTarget.dataset.id}`)
  },
  addCoupons: function addCoupons() {
    wx.navigateTo({
      url: './add-coupons?type=1'
    });
  }
});
'use strict';

var app = getApp();

app.MoviePage({
  data: {
    coupons: null,
    type: 0
  },

  onLoad: function onLoad(options) {
    this.setData({
      type: options.type ? parseInt(options.type) : 0
    });
    // this.getMyCoupons()
    this.number = '';
    this.passWord = '';
    this.isPost = false;
  },
  onPullDownRefresh: function onPullDownRefresh() {
    // this.getMyCoupons(true);
  },
  bindNumber: function bindNumber(e) {
    console.log(e.detail.value);
    this.number = e.detail.value;
  },
  bindPassword: function bindPassword(e) {
    console.log(e.detail.value);
    this.passWord = e.detail.value;
  },


  /**
   * 获取用户优惠券列表
   */
  addCoupons: function addCoupons() {
    var _this = this;
    if(_this.isPost) return;
    _this.isPost = true;
    this.loading(true);
    var type = this.data.type;

    app.request().post('/order/bindGoods').query({
      goodsType: type,
      number: this.number,
      password: this.passWord
    }).end().then(function (res) {
      if (res.body.code == 0) {
        _this.toast(res.body.msg);
        _this.timer = setTimeout(function(){
          wx.navigateBack({
            delta: 1
          });
        },1e3);
      } else {
        _this.toast(res.body.msg);
        _this.isPost = false;
      }
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
  onUnload: function(){
    clearTimeout(this.timer);
  }
});
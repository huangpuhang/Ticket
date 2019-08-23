'use strict';

var app = getApp();
var util = require('../../scripts/util.js');
app.MoviePage({

  /**
   * 页面的初始数据
   */
  data: {
    hiddenWrap:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function onLoad(options) {
    this.reload(options.ticketOrderId);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {

  // },
  reload: function reload(ticketOrderId) {
    var _this = this;

    this.loading(true);
    app.request().get('/order/info').query({
      ticketOrderId: ticketOrderId
    }).end().then(function (res) {
      if (res.body.code == 0) {
        var data = res.body.data;
        data.showTimeStr = util.getFormatDate1(data.showtime);
        data.orderTime = util.getFormatDate(data.orderEndTime);
        _this.setData({
          order: data,
          hiddenWrap: false
        });
      }
      _this.loading(false);
      wx.stopPullDownRefresh();
    });
  },
  showMap: function showMap() {
    var cinemaEntity = this.data.order.cinemaEntity;

    if (cinemaEntity) {
      wx.openLocation({
        latitude: +cinemaEntity.latitude,
        longitude: +cinemaEntity.longitude,
        name: cinemaEntity.cinemaName,
        address: cinemaEntity.cinemaAddress
      });
    }
  },
  makePhoneCall: function makePhoneCall(e) {
    var phone = e.currentTarget.dataset.phone;

    if (phone) wx.makePhoneCall({
      phoneNumber: phone
    });
  }
});
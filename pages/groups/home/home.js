'use strict';

// pages/groups/home/home.js
var app = getApp();

app.MoviePage({

  /**
   * 页面的初始数据
   */
  data: {
    activityList: [],
    typeId: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function onLoad(options) {
    this.getActivityList(1);
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
  onShareAppMessage: function onShareAppMessage() {},
  gotoDetails: function gotoDetails(e) {
    var activityid = e.currentTarget.dataset.activityid;
    var typeId = this.data.typeId;

    wx.navigateTo({
      url: '/pages/groups/details/details?activityid=' + activityid + '&typeid=' + typeId
    });
  },
  getActivityList: function getActivityList(type_id) {
    var _this = this;

    this.loading(true);
    app.request().get('/activity/list').query({
      typeId: type_id
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (data) {
      _this.loading(false);
      wx.stopPullDownRefresh();
      _this.setData({
        activityList: data
      });
    }).catch(function (err) {
      _this.loading(false);
    });
  },
  tapChangebar: function tapChangebar(e) {
    var type = e.currentTarget.dataset.type;

    if (type) {
      var typeId = parseInt(type);
      this.getActivityList(typeId);
      this.setData({
        typeId: typeId
      });
    }
  }
});
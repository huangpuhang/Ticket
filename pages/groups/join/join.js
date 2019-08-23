'use strict';

// pages/groups/join/join.js
var app = getApp();

app.MoviePage({

  /**
   * 页面的初始数据
   */
  data: {
    activityEntity: {},
    isShare: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function onLoad(options) {
    this.setData({
      activityEntity: app.$activityEntity
    });
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
  tapShare: function tapShare(e) {
    var share = e.currentTarget.dataset.share;

    var isShare = false;
    if (share == 'show') {
      isShare = true;
    } else {
      isShare = false;
    }
    this.setData({
      isShare: isShare
    });
  }
});
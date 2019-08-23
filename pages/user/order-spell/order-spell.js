'use strict';

// pages/mine/order-tickets/order-tickets.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function onLoad(options) {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function onShow() {},
  // 切换tab
  tapTabs: function tapTabs(event) {
    console.log('tapTabs event', event);
    if (this.data.currentTab === event.currentTarget.dataset.current) {
      return false;
    } else {
      this.setData({
        currentTab: event.currentTarget.dataset.current
      });
    }
    console.log('event.currentTarget.dataset.current', event.currentTarget.dataset.current);
    console.log('this.data.currentTab', this.data.currentTab);
  },
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
  onShareAppMessage: function onShareAppMessage() {}
});
'use strict';

var app = getApp();

var pagequery = {};
app.MoviePage({
  onLoad: function onLoad() {

    var storageIndex = app.get('_');
    var storage = {};
    if (storageIndex) {
      storage = storageIndex.keys.map(function (key) {
        return {
          key: key, value: JSON.stringify(app.get(key))
        };
      });
    }

    var pages = [{
      name: '首页',
      url: '/pages/movie/index'
    }, {
      name: '确认订单',
      url: '/pages/order/buy',
      query: 'orderId='
    }, {
      name: '城市选择',
      url: '/pages/locate/index'
    }];

    this.setData({
      storage: storage, pages: pages,
      requests: app.$requests,
      location: app.$location
    });
  },
  onShow: function onShow() {
    this.onLoad();
  },
  onTapPage: function onTapPage(e) {
    var page = e.currentTarget.dataset.page;

    wx.navigateTo({
      url: page + '?' + (pagequery[page] || this.data.pages.find(function (p) {
        return p.url === page;
      }).query || '')
    });
  },
  onChangePage: function onChangePage(e) {
    var page = e.currentTarget.dataset.page;

    pagequery[page] = encodeURI(e.detail.value);
  },
  clear: function clear() {
    app.set(null);
    app.$user = {};
    this.onLoad();
  }
});
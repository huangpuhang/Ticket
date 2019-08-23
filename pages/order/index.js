"use strict";

var app = getApp();
var date = require('../../scripts/date.js');
var Date2 = app.require('scripts/date2');

var ORDER_STATUS = {
  0: ["取消", "付款"],
  1: ["已取消", "重新购买"],
  2: ["支付超时", "重新购买"],
  3: ["已完成"],
  4: ["锁座失败", "重新购买"],
  5: ["场次取消", "重新购买"],
  6: ["出票中"],
  7: ["出票失败"],
  8: ["已退款"],
  9: ["未消费"],
  10: ["已完成"]
};
var REFUND_STATUS = {
  1: "退款中",
  2: "退款成功",
  3: "退款失败"
};

var MIGRATE_STATUS = {
  1: '改签中',
  2: '已改签',
  3: '改签失败', // 原电影票已经取票
  4: '改签失败', // 网络原因
  5: '改签失败', // 原电影票已自动退款
  6: '改签失败', // 原电影票已经改签成功
  7: '改签失败' // 原电影票退票失败
};

var initData = {
  orders: [],
  currentTab: 0,
  allOrders: [],
  newOrders: [],
  bindGoods: [],
  paidOrders: [],
  finishOrders: [],
  refundOrders: []
}

app.MoviePage({
  data: initData,
  onLoad: function onLoad() {
    this.loading(true);
  },
  onUnload: function onUnload() {
    clearInterval(this.timer);
  },
  onShow: function onShow() {
    // app.user()
    //   .then(this.reload, this.reload)
    //   .catch(err => {
    //     if (!this.data.orders) {
    //       this.handleError(err, true)
    //     }
    //   })
    this.reload();
  },
  onPullDownRefresh: function onPullDownRefresh() {
    var _this = this;

    this.reload().catch(function (err) {
      if (_this.data.orders) {
        _this.handleError(err);
      } else {
        _this.handleError(err, true);
      }
    });
  },
  onTapCancelOrder: function onTapCancelOrder(evt) {
    var _this2 = this;

    var orderId = evt.currentTarget.dataset.orderId;
    wx.showModal({
      title: '取消订单',
      content: '取消后座位将不再保留，是否取消？',
      success: function success(res) {
        if (res.confirm) {
          _this2.cancelOrder(orderId);
        }
      }
    });
  },
  reload: function reload() {
    var _this3 = this;
    _this3.setData(initData);
    app.request().get("/user/ticketOrderList").query({
      pageIndex: 1
    }).end().then(function (res) {
      if (res.body.code == 0) {
        var orders = res.body.data.content;
        var _data = _this3.data,
            newOrders = _data.newOrders,
            bindGoods = _data.bindGoods,
            paidOrders = _data.paidOrders,
            finishOrders = _data.finishOrders,
            refundOrders = _data.refundOrders;

        _this3.orders = orders;
        orders.map(function (item) {
          var time = ' ' + new Date(item.realTimeValue).getHours() + ':' + new Date(item.realTimeValue).getMinutes();
          item.realTime = date.fomateDate(item.realTimeValue) + time;
          switch (item.status) {
            case 0:
              item.url = '/pages/order/buy?orderId=' + item.id + '&orderSeatsText=' + item.seatNames + ''
              newOrders.push(item);
              break;
            case 1:
              item.url = '/pages/order/buy?orderId=' + item.id + '&orderSeatsText=' + item.seatNames + ''
              newOrders.push(item);
              break;
            case 30:
              item.url = '/pages/order/order-details?ticketOrderId=' + item.id
              paidOrders.push(item);
              break;
            case 100:
              item.url = '/pages/order/order-details?ticketOrderId=' + item.id
              finishOrders.push(item);
              break;
            case 20:
              item.url = '';
              refundOrders.push(item);
              break;
          }
        });
        _this3.setData({
          orders: orders,
          allOrders: orders,
          newOrders: newOrders,
          bindGoods: bindGoods,
          paidOrders: paidOrders,
          finishOrders: finishOrders,
          refundOrders: refundOrders
        });
      }
      _this3.loading(false);
      wx.stopPullDownRefresh();
    });
  },


  // 团购订单，已去掉
  getGroupGoodsOrders: function getGroupGoodsOrders() {
    return app.request().get("/hostproxy/group/v1/user/" + app.$user.userId + "/ordercenternew/all").header({
      token: app.$user.token,
      'x-host': 'http://apimobile.vip.sankuai.com'
    }).query({
      limit: 2147483647,
      dealtype: 'movie',
      dealFields: ['imgurl', 'smstitle', 'refund', 'menu', 'title', 'brandname', 'price', 'value', 'status', 'end', 'rdcount', 'rdplocs', 'tips', 'slug', 'subcate', 'terms', 'fakerefund', 'sevenrefund', 'howuse', 'voice', 'coupontitle', 'dt', 'id'].join(',')
    }).end().then(function (res) {
      return res.body.data.map(function (order) {
        order.deal.imgurl = app.img(order.deal.imgurl, 114, 114);
        order.deal.endTime = new Date2(order.deal.end * 1000).toString('yyyy-MM-dd');
        order.type = 'groupGoods';
        return order;
      });
    });
  },
  showCancelOrderFailed: function showCancelOrderFailed() {
    wx.showModal({
      content: '取消订单失败，请稍后再试',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 切换tab
  tapTabs: function tapTabs(event) {
    console.log('tapTabs event', event);
    var orders = [];
    var current = parseInt(event.currentTarget.dataset.current);
    if (this.data.currentTab === current) {
      return false;
    } else {
      switch (current) {
        case 0:
          orders = this.orders;
          break;
        case 1:
          orders = this.data.newOrders;
          break;
        case 2:
          orders = this.data.paidOrders;
          break;
        case 3:
          orders = this.data.finishOrders;
          break;
        case 4:
          orders = this.data.refundOrders;
          break;
      }
      this.setData({
        currentTab: current,
        orders: orders
      });
    }
  },
  cancleOrder: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      content: '是否取消该订单？',
      confirmText: '是',
      cancelText: '否',
      success: function (res) {
        if (res.confirm) {
          app.request().post('/order/cancle').query({
            ticketOrderId: id
          }).end().then(function (res) {
            that.reload();
          }).catch(function (err) {

          });
        }
      }
    })
  },
  tapOrder: function tapOrder(e) {
    var ticketOrderId = e.currentTarget.dataset.ticketOrderId;

    app.goto("../friends/friends?ticketOrderId=" + ticketOrderId + "&type=0");
    // app.goto(`index?eMemberCardId=${e.currentTarget.dataset.id}`)
  }
});
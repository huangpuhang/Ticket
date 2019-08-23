'use strict';

var Date2 = require('../../scripts/date2.js');

var app = getApp();

var PROD = true;
/**
 * 其它: '已完成',
 * 7: '出票失败',
 * 8: '退款',
 * 9: '未消费',
 */

app.MoviePage({
  data: {
    migrateModalShow: false,
    refundProgressMap: {
      0: '申请退款',
      1: '退款中',
      2: '退款成功',
      3: '退款失败'
    },
    migrateProgressMap: {
      0: '申请改签',
      1: '改签中',
      2: '已改签',
      3: '改签失败', // 原电影票已经取票
      4: '改签失败', // 网络原因
      5: '改签失败', // 原电影票已自动退款
      6: '改签失败', // 原电影票已经改签成功
      7: '改签失败' // 原电影票退票失败
    },
    migrateExplain: {
      hide: true,
      content: []
    },
    abnormalStatusMap: {
      6: {
        title: '正在出票...',
        icon: '/images/order/ticket-wait-box.png'
      },
      7: {
        title: '出票失败',
        icon: '/images/order/ticket-fail.png'
      }
    },

    orderStatusMap: {
      70: '/images/order/ticket-draw-fail.png',
      81: '/images/order/refund-pending.png',
      82: '/images/order/refund-success.png',
      83: '/images/order/refund-fail.png'
    },
    theme: app.$theme,
    showSuccessPopup: false,
    popupData: {},
    hasAuth: true
  },
  onLoad: function onLoad(options) {
    this.refreshIndex = 0;
    // app.$openId = 2;
    this.loading();
    this.options = options;
    this.setData(options);
  },
  onShow: function onShow() {
    var _this = this;

    // app.checkLogin(() => {
    this.onPullDownRefresh().then(function () {
      _this.loading(false);
    }, function () {
      _this.loading(false);
    });
    // })
  },
  onPullDownRefresh: function onPullDownRefresh() {
    var _this2 = this;

    this.refreshIndex++;
    var _options = this.options,
        ticketOrderId = _options.ticketOrderId,
        orderSeatsText = _options.orderSeatsText;

    app.request().get('/order/info').query({
      'ticketOrderId': ticketOrderId
    }).end().then(function (res) {
      _this2.loading(false);
      if (res.body.code == 0) {
        console.log(res.body.data);
        var orderInfo = res.body.data;
        orderInfo.orderShowTime = Date2(orderInfo.showtime).toString('EMM-dd HH:mm');
        orderInfo.orderSeats = orderSeatsText;
        if (orderInfo.status == 2) {
          if (_this2.refreshIndex < 10) {
            setTimeout(function () {
              _this2.onPullDownRefresh();
            }, 5000);
          }
        }
        _this2.setData({
          order: orderInfo
        });
      } else {}
      // this.toast(`锁座失败，请重试`);

      // console.log(this.selectSeat)
    }).catch(function (err) {
      _this2.loading(false);
      // this.toast(`锁座失败，请重试`);
    });
    // return this.getOrderInfo(this.options)
  },
  getOrderInfo: function getOrderInfo(options) {
    var _this3 = this;

    return app.request().get('/proxy/' + (PROD ? '' : 'api/') + 'orderquery/v6/order/' + options.orderId + '.json').query({
      clientType: 'touch',
      channelId: app.channelId
    }).header({
      token: app.$user.token,
      'x-ta': 1,
      'x-host': PROD ? 'http://maoyanapi.vip.sankuai.com' : 'http://api.be.movie.st.sankuai.com',
      'content-type': 'multipart/form-data'
    }).end().then(function (res) {
      return res.body.data;
    }).then(function (order) {
      order.showTime = Date2(order.show.startTime).toString('MM月dd日 HH:mm');
      return order;
    }).then(function (order) {
      order.exchange.originIdChunk = app.code(order.exchange.originId);
      order.exchange.exchangeCodeChunk = app.code(order.exchange.exchangeCode);

      _this3.getEgg(order.movie.id);

      _this3.setData(order);
      _this3.setData({
        //当前订单改签角色是target && target对象存在 && 改签状态是成功状态 && 未消费时 展示改签成功modal
        migrateModalShow: _this3.data.migratesuccess == 'true' && order.migrate.role == 'target' && !!order.migrate[order.migrate.role] && order.migrate[order.migrate.role].status == 2 && !order.order.refundStatus && !order.order.exchangeStatus
      });
      _this3.setData({
        movie: order.movie
      });

      var migrateRole = order.migrate.role;
      var migrateObj = order.migrate[migrateRole];
      //正在出票中 或 改签中
      if (order.order.uniqueStatus == 6 || !!migrateObj && migrateObj.status == 1 && migrateRole == 'target') {
        setTimeout(function () {
          _this3.getOrderInfo(options);
        }, 2000);
      }

      if (order.order.fixStatus === 1 && _this3.options.showPopup) {
        _this3.fixSuccessPopup();
      }

      if (app.formId) {
        var data = {};
        var template_id = '';
        if (order.order.fixStatus == 1) {
          //电影名：order.movie.name
          //取票码：这个key是从后台返回回来的可能会变 具体参考下面
          //序列号：这个key是从后台返回回来的可能会变 具体参考下面
          //order.exchange.originIdName: order.exchange.originIdChunk || order.exchange.originId ( if(order.exchange.originId) )
          //order.exchange.exchangeCodeName: order.exchange.exchangeCodeChunk || order.exchange.exchangeCode ( if(order.exchange.exchangeCode) )
          //订单号：order.id
          //时间：order.showTime
          //影院：order.cinema.name
          var _order$exchange = order.exchange,
              exchangeCode = _order$exchange.exchangeCode,
              exchangeCodeName = _order$exchange.exchangeCodeName,
              originId = _order$exchange.originId,
              originIdName = _order$exchange.originIdName;

          var origin = originId ? originIdName + ':' + originId + '/' : '';
          var exchangeText = '' + origin + exchangeCodeName + ':' + exchangeCode;

          var seatList = order.seats.list.map(function (seat) {
            return seat.rowId + '\u6392' + seat.columnId + '\u5EA7';
          });
          template_id = 'pKTWUWayhLFUNoqzMrWm6EF9ImUdth2WCSYyE7asYzM';
          data = {
            keyword1: {
              value: order.movie.name
            },
            keyword2: {
              // 取票码
              value: exchangeText
            },
            keyword3: {
              //  放映时间
              value: order.showTime
            },
            keyword4: {
              //  座位信息
              value: seatList.join(' / ')
            },
            keyword5: {
              //  订单编号
              value: order.id
            },
            keyword6: {
              //  影院地点
              value: order.cinema.address
            },
            keyword7: {
              //  影院影厅
              value: order.cinema.name + order.seats.hallName
            }
          };
        } else if (order.order.fixStatus == 2) {
          template_id = 'oDJoodKxGoe_gwA0i_iEICESpCIPL6TMKS85EgU3Byk';
          data = {
            keyword1: {
              // 订单号
              value: order.id
            },
            keyword2: {
              //  客服电话
              value: 10105335
            },
            keyword3: {
              // 影院名
              value: order.cinema.name
            },
            keyword4: {
              // 影片名
              value: order.movie.name
            },
            keyword5: {
              // 备注
              value: order.order.statusDesc
            }
          };
        }

        if (template_id) {
          app.sendMessage({
            template_id: template_id,
            form_id: app.formId,
            page: 'pages/order/order?orderId=' + order.id,
            data: data
          });
          delete app.formId;
        }
      }
    }).catch(function (err) {
      if (err.res.data.error.code === 4001) {
        _this3.setData({
          hasAuth: false
        });
      } else if (_this3.data.id) {
        _this3.handleError(err);
      } else {
        _this3.handleError(err, 'page');
      }
    });
  },
  getEgg: function getEgg(movieId) {
    var _this4 = this;

    return app.request().get('/hostproxy/mmdb/movie/egg/' + movieId + '.json').header({
      'x-host': 'http://maoyanapi.vip.sankuai.com'
    }).end().then(function (res) {
      var endEgg = res.body.data.endEgg;


      if (endEgg) {
        _this4.setData({
          endEgg: endEgg
        });
      }
    });
  },
  onTapMap: function onTapMap() {
    var cinema = this.data.cinema;

    wx.openLocation({
      name: cinema.name,
      latitude: Number(cinema.lat),
      longitude: Number(cinema.lng),
      address: cinema.address
    });
  },
  onTapMobile: function onTapMobile(e) {
    var mobileList = [e.target.dataset.mobile];
    wx.showActionSheet({
      itemList: mobileList,
      itemColor: app.$theme == 'my' ? '#EF4238' : '#586C94',
      success: function success(_ref) {
        var cancel = _ref.cancel,
            tapIndex = _ref.tapIndex;

        if (!cancel) {
          wx.makePhoneCall({
            phoneNumber: mobileList[tapIndex]
          });
        }
      }
    });
  },

  applyRefund: function applyRefund() {
    var _this5 = this;

    var _data = this.data,
        refund = _data.refund,
        orderId = _data.orderId,
        source = _data.source;

    if (refund.allow || refund.refundProgress) {
      app.request().get('/hostproxy' + (PROD ? '' : '/api') + '/queryorder/v1/refunddetail.json').header({
        token: app.$user.token,
        'x-host': PROD ? 'http://maoyanapi.vip.sankuai.com' : 'http://api.be.movie.st.sankuai.com'
      }).query({
        token: app.$user.token,
        orderId: orderId
      }).end().then(function (res) {
        var status = res.body.data.status;

        var urlObj = { url: '/pages/order/refund/apply?orderId=' + orderId };
        if (status) {
          urlObj = { url: '/pages/order/refund/detail?orderId=' + orderId };
        }
        if (source == 'orderlist') {
          urlObj.url += '&source=' + source;
        }
        app.goto(urlObj.url);
      }).catch(function (err) {
        _this5.handleError(err);
      });
    } else {
      this.toast(refund.notAllowRefundReason);
    }
  },
  showExplain: function showExplain() {
    var _this6 = this;

    app.request().get('/hostproxy/order/v6/' + this.data.orderId + '/migrate.json').query({
      clientType: 'touch',
      channelId: app.channelId
    }).header({
      token: app.$user.token,
      'x-host': 'http://maoyanapi.vip.sankuai.com',
      'content-type': 'multipart/form-data'
    }).end().then(function (res) {
      console.log(res);
      var data = res.body.data;
      var migrateExplainObj = {
        content: []
      };
      if (data.allow) {
        migrateExplainObj.hide = false;
        for (var i = 1; i < 4; i++) {
          migrateExplainObj.content.push(data['explain' + i].split('\n'));
        }
        _this6.setData({
          migrateExplain: migrateExplainObj
        });
      } else {
        _this6.toast(data.denyReason);
      }
    }).catch(function (err) {
      _this6.handleError(err);
    });
  },
  hideExplain: function hideExplain(event) {
    if (event.target.dataset.id !== 'explain') {
      var tmpData = this.data;
      tmpData.migrateExplain.hide = true;
      this.setData(tmpData);
    }
  },
  applyMigrate: function applyMigrate() {
    var _data2 = this.data,
        cinema = _data2.cinema,
        movie = _data2.movie,
        show = _data2.show,
        orderId = _data2.orderId,
        source = _data2.source,
        seats = _data2.seats;

    var day = Date2(show.startTime).toString('yyyy-MM-dd');
    var urlObj = { url: '/pages/cinema/cinema?cinemaId=' + cinema.id + '&movieId=' + movie.id + '&movieName=' + movie.name + '&day=' + day + '&sourceOrderId=' + orderId + '&seatCount=' + seats.count };
    if (source == 'orderlist') {
      urlObj.url += '&source=' + source;
    }
    app.goto(urlObj.url);
  },
  onHide: function onHide() {
    this.setData({
      migrateExplain: {
        hide: true,
        content: []
      }
    });
  },
  migrateModalConfirm: function migrateModalConfirm() {
    wx.redirectTo({ url: '/pages/order/refund/detail?orderId=' + this.data.id });
  },
  migrateModalCancel: function migrateModalCancel() {
    this.setData({
      migrateModalShow: false
    });
  },
  back: function back() {
    wx.navigateBack();
  },

  // 出票后判断是否有红包弹窗
  fixSuccessPopup: function fixSuccessPopup() {
    var _this7 = this;

    var url = PROD ? '/proxy/queryorder/v1/fixSuccessPopup.json' : '/proxy/api/queryorder/v1/fixSuccessPopup.json';
    app.request().get(url).query({
      orderId: this.options.orderId
    }).header({
      token: app.$user.token,
      'x-ta': 1,
      'x-host': PROD ? 'http://maoyanapi.vip.sankuai.com' : 'http://api.be.movie.st.sankuai.com'
    }).end().then(function (res) {
      var data = res.body.data;

      if (data && data.templateNo === 3) {
        _this7.options.showPopup = false;
        data.img = app.img(data.img, 345, 195);
        data.subDesc = data.subDesc.replace(/\[|]/g, '');
        _this7.setData({
          showSuccessPopup: true,
          popupData: data
        });
      }
    }).catch(function (err) {
      return _this7.handleError(err);
    });
  },
  closePopup: function closePopup() {
    this.setData({
      showSuccessPopup: false
    });
  },
  onShareAppMessage: function onShareAppMessage() {
    var _data3 = this.data,
        showSuccessPopup = _data3.showSuccessPopup,
        _data3$popupData = _data3.popupData,
        confirmBtnUrl = _data3$popupData.confirmBtnUrl,
        info = _data3$popupData.info,
        funcType = _data3$popupData.funcType,
        movie = _data3.movie;
    var _options2 = this.options,
        orderId = _options2.orderId,
        source = _options2.source;


    var title = '\u300A' + movie.name + '\u300B\u7535\u5F71\u7968';
    var desc = '可凭下图中的验证码去影院取票';
    if (funcType === 'SHARE' && info) {
      title = info.shareTitle;
      desc = info.shareContent;
    } else if (funcType === 'JUMP' && showSuccessPopup) {
      title = '我得到了一张代金券';
      desc = '在猫眼电影购票有机会获得一张代金券哦';
    }
    return {
      title: title,
      desc: desc,
      path: confirmBtnUrl ? 'pages' + confirmBtnUrl : 'pages/order/order?orderId=' + orderId + '&source=' + source
    };
  },
  doNothing: function doNothing() {},
  errRedirect: function errRedirect() {
    wx.switchTab({
      url: '/pages/movie/index'
    });
  }
});
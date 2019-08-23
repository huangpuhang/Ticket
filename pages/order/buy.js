'use strict';

var app = getApp();
var Date2 = require('../../scripts/date2.js');
var modal = require('../../scripts/modal.js');
var risk = require('../../scripts/risk.js');
var date = require('../../scripts/date.js');

var PROD = true;
var PROD_PAY = true;

var timerPayLeft = void 0;
var _orderSeatsText = void 0;
var _orderId = void 0;

app.MoviePage({
  data: {
    modalHidden: true,
    order: {},
    inputFocus: false,
    inputError: false,
    panelExpand: false,
    magiccardValue: '',
    theme: app.$theme,
    isShowHelpInputPhone: false,
    timeover: false,
    availableList: [],
    cards: [],
    redPacket: [],
    checkedText: '',
    couponList: [],
    disSwitch: false,
    isConfirmPay: false,
    hiddenWrap: true,
    submitBtnName: '确认订单',
    hiddenActiveDlg: true
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;
    var orderId = options.orderId,
        fee = options.fee,
        payNum = options.payNum,
        seatLable = options.seatLable,
        totalFee = options.totalFee,
        unitPrice = options.unitPrice,
        orderSeatsText = options.orderSeatsText,
        seatsLen = options.seatsLen;

    this.seatsLen = parseInt(seatsLen);
    this.orderId = orderId;
    this.orderSeatsText = orderSeatsText;
    this.goodsType = 0;
    _orderSeatsText = orderSeatsText;
    _orderId = orderId;
    this.updateCode();
    this.loading(true);
    modal(this, {
      maoyanActivityAndCoupon: {},
      merchantCoupon: {}
    });

    app.request().get('/order/info').query({
      'ticketOrderId': orderId
    }).end().then(function (res) {
      _this.loading(false);
      if (res.body.code == 0) {
        // console.log(res.body.data);
        var orderInfo = res.body.data;
        _this.payEndDate = orderInfo.orderEndTime * 1;
        _this._totalPrice = orderInfo.totalPrice;
        orderInfo.orderShowTime = Date2(orderInfo.showtime).toString('EMM-dd HH:mm');
        orderInfo.orderSeats = orderSeatsText ? orderSeatsText : orderInfo.seatName;
        orderInfo._totalPrice = orderInfo.totalPrice;
        _this.setData({
          order: orderInfo,
          hiddenWrap: false,
          payTip: '还需支付:',
          // availableList: []
        });
        if(orderInfo.dedeductionAmount == 0){
          _this.setData({disSwitch:true});
        }
        if (orderInfo.status == 1) {
          _this.setData({
            isConfirmPay: true,
            deductionAmount: orderInfo.deductionAmount
          });
        }
        var sendParam = {
          endTime: _this.payEndDate - new Date() * 1,
          price: orderInfo.totalPrice / 100,
          orderId: orderInfo.id,
          movieName: orderInfo.movieName,
          movieImage: orderInfo.movieEntity.movieVerticalImage,
          orderShowTime: orderInfo.orderShowTime,
          movieLanguage: orderInfo.movieLanguage,
          movieVersion: orderInfo.movieVersion,
          cinemaName: orderInfo.cinemaName,
          orderSeats: orderInfo.orderSeats,
          orderSeatsText: _orderSeatsText
        };
        // console.log('sendParam',sendParam);
        _this.setData({
          sendParam:sendParam
        });

        _this.getGoodslist(orderInfo.goodsDetailEntities);
      } else {}
      // this.toast(`锁座失败，请重试`);

      // console.log(this.selectSeat)
    }).catch(function (err) {
      _this.loading(false);
      // this.toast(`锁座失败，请重试`);
    });

    // 活动与优惠券窗口
    // listen(this.maoyanActivityAndCoupon, 'refreshCheckedText', (data) => {
    //   data.checkedText = joinText('已选择', [
    //     {
    //       value: data.maoyanActivity.withActivity,
    //       text: '1个活动',
    //     },
    //     {
    //       value: data.availableList.filter(c => c.checked).length,
    //       separator: '，',
    //       text: '$value张优惠券',
    //     }
    //   ]);
    // });
    // listen(this.maoyanActivityAndCoupon, 'setdata', (chosen) => {
    //   let maoyanActivityAndCoupon = this.data.priceCells
    //     .filter(p => p.name === 'maoyanActivityAndCoupon')
    //     .map(p => p.ext);
    //   maoyanActivityAndCoupon = maoyanActivityAndCoupon[0] || {};
    //   chosen = chosen || maoyanActivityAndCoupon.chosenMaoyanCoupon;
    //   for (var i = 0; i < maoyanActivityAndCoupon.availableList.length; i++) {
    //     let c = maoyanActivityAndCoupon.availableList[i];
    //     c.checked = !!chosen.filter(i=> i.code === c.code && i.source === c.source )[0];
    //   }

    //   maoyanActivityAndCoupon.availableList = [
    //     {
    //       type: 1,
    //       title: '猫眼电影',
    //       code: '11111111',
    //       subType: '2D/3D',
    //       value: 10,
    //       endTime: 0,
    //       leftDesc: '3天后过期',
    //       limitDesc: '仅限团购用户使用仅限团购用户使用仅限团购用户使用仅限团购用户使用',
    //       showUseful: 1,
    //       unUsefulReason: '首购只限用一张',
    //       source: 1
    //     },
    //     {
    //       type: 2,
    //       title: '猫眼电影',
    //       code: '333333333',
    //       subType: '2D/3D',
    //       value: 10,
    //       endTime: 0,
    //       leftDesc: '10天后过期',
    //       limitDesc: '仅限团购用户使用仅限团购用户使用仅限团购用户使用仅限团购用户使用',
    //       showUseful: 0,
    //       unUsefulReason: '首购只限用一张',
    //       source: 1
    //     },
    //   ];
    //   this.maoyanActivityAndCoupon.emit('refreshCheckedText', maoyanActivityAndCoupon);
    //   this.setData({ maoyanActivityAndCoupon });
    // });
    // // 商家券弹窗
    // listen(this.merchantCoupon, 'refreshCheckedText', (data)=> {
    //   data.checkedText = joinText('已选择', [
    //     {
    //       value: data.availableList.filter(c => c.checked).length,
    //       text: '$value张商家券'
    //     }
    //   ])
    // });
    // listen(this.merchantCoupon, 'setdata', ()=>{
    //   let merchantCoupon = this.data.priceCells
    //     .filter(p => p.name === 'merchantCoupon')
    //     .map(p => p.ext);
    //   merchantCoupon = merchantCoupon[0] || {};

    //   if(merchantCoupon.availableList[0]){
    //     for (var i = 0; i < merchantCoupon.availableList.length; i++) {
    //       let c = merchantCoupon.availableList[i];
    //       c.checked = !!merchantCoupon.chosenMerchantCoupon
    //         .filter(i=> i.code === c.code && i.source === c.source )[0]
    //     }
    //   }

    // merchantCoupon.availableList = [
    //   {
    //     "type": 1,                     //优惠券类型：1 代金券，2通兑券
    //     "title": "猫眼电影",            //代金券标题
    //     "code": "69766766",           //代金券验证码
    //     "subType": "2D",              //券类型是通兑券时，表示通兑券的类型，如2D、IMAX、2D3D通用等
    //     "value": 1.00,                //券类型是代金券时，表示代金券的金额
    //     "endTime":0,                  //过期时间
    //     "leftDesc":"3天后过期",        //过期描述
    //     "limitDesc":"仅限团购用户使用",  //限制描述
    //     "showUseful":1,               //当前场次是否可用
    //     "unUsefulReason":"首购只限用一张", // 优惠券不可用原因
    //     "source": 1,                  //客户端请在支付的时候提交这个字段
    //   },
    //   {
    //     "type": 2,                     //优惠券类型：1 代金券，2通兑券
    //     "title": "猫眼电影",            //代金券标题
    //     "code": "11169766766",           //代金券验证码
    //     "subType": "2D",              //券类型是通兑券时，表示通兑券的类型，如2D、IMAX、2D3D通用等
    //     "value": 1.00,                //券类型是代金券时，表示代金券的金额
    //     "endTime":0,                  //过期时间
    //     "leftDesc":"3天后过期",        //过期描述
    //     "limitDesc":"仅限团购用户使用",  //限制描述
    //     "showUseful":0,               //当前场次是否可用
    //     "unUsefulReason":"首购只限用一张", // 优惠券不可用原因
    //     "source": 1,                  //客户端请在支付的时候提交这个字段
    //   }
    // ];

    // this.merchantCoupon.emit('refreshCheckedText', merchantCoupon);
    // this.setData({ merchantCoupon });
    // });

    // r
    // isk.params(); // 预调用, 提高获取参数的速度

    // 刷新订单
    // listen(this, 'refreshorderdata', () => {
    //   this.fetchOrder()
    //     .then(data => {
    //       if (data.order.msg) {
    //         wx.showModal({
    //           title: '确认订单',
    //           content: data.order.msg,
    //           showCancel: false,
    //           // confirmColor: app.$theme == 'my'? '#333333': '#02BB00'
    //         });
    //       }
    //       this.emit('setorderdata', data);
    //     })
    //     .catch(err => {
    //       if (Object.keys(this.data.order).length) {
    //         this.handleError(err)
    //       } else {
    //         this.handleError(err, true)
    //       }
    //     });
    // });
    // 设置订单数据
    // listen(this, 'setorderdata', data => {
    //   data.orderShowTime = Date2(data.order.showTime).toString('EMM-dd HH:mm');
    //   data.orderSeats = data.order.seats.list.map(s => `${s.rowId}排${s.columnId}座`).join(); // TODO 支持分区域?, 直接拼接是否合理
    //   const discountCard = data.priceCells.filter(item => item.name === 'discountCard')[0]

    //   data.migrateTip = data.migrate.tip ? data.migrate.tip.split('\n') : '';
    //   data.refundMigrateTip = data.refundMigrateTip && data.refundMigrateTip.split
    //     ? data.refundMigrateTip.split('\n')
    //     : ''
    //   let migrateCell = data.priceCells.filter(cell => cell.name === 'migrate');
    //   let payTip = '';
    //   let payMoney = '';
    //   if (migrateCell.length) {
    //     payTip = (migrateCell[0].ext.mode === 1 ? '还需支付:' : '实际退还:');
    //     payMoney = migrateCell[0].ext.deduct;
    //   } else {
    //     payTip = '还需支付:';
    //     payMoney = data.pricePackage.payMoney;
    //   }
    //   data.payTip = payTip;
    //   data.payMoney = payMoney;
    //   data.payEndDate = +new Date() + (data.order.payLeftSecond * 1000);

    //   if (!data.order.mobilePhone) {
    //     data.order.mobilePhone = app.$user.mobile
    //   }

    //   // mock 会员卡
    //   let discountCardCell = data.priceCells.find(c => c.name === 'discountCard');
    //   if (discountCardCell == null) {
    //     discountCardCell = {
    //       name: 'discountCard',
    //       display: '会员卡',
    //     };
    //     data.priceCells.push(discountCardCell);
    //   }
    //   discountCardCell.ext = {
    //     desc: '-10元',
    //     grey: false,
    //     greyText: '购票数已达本日限额',
    //   };
    //   // mock 活动和抵用券
    //   let maoyanActivityAndCouponCell = data.priceCells.find(c => c.name === 'maoyanActivityAndCoupon');
    //   if (maoyanActivityAndCouponCell == null) {
    //     maoyanActivityAndCouponCell = {
    //       name: 'maoyanActivityAndCoupon',
    //       display: '活动和抵用券',
    //     };
    //     data.priceCells.push(maoyanActivityAndCouponCell);
    //   }
    //   maoyanActivityAndCouponCell.ext = {
    //     "activityName":"北京西雅图特惠",  //cell上展示的活动标
    //     "couponName": "2张券可用",  //cell上展示的券标
    //     "desc":"-¥18.2",  //或者 1个活动,5张券可用  无可用
    //     "maoyanActivity":{
    //       "exist": true, //是否存在活动
    //       "name":"北京西雅图特惠",
    //       "info":"全场 19.9元，每人限购2张",
    //       "withActivity":  true,
    //       "prefDesc": "活动已减¥5"
    //     },
    //     "voucherCouponMax": 1,  //代金券最大使用张数
    //     "availableList": [
    //         {
    //           "type": 1,                     //优惠券类型：1 代金券，2通兑券
    //           "title": "猫眼电影",            //代金券标题
    //           "code": "69766766",           //代金券验证码
    //           "subType": "2D",              //券类型是通兑券时，表示通兑券的类型，如2D、IMAX、2D3D通用等
    //           "value": 1.00,                //券类型是代金券时，表示代金券的金额
    //           "endTime":0,                  //过期时间
    //           "leftDesc":"3天后过期",        //过期描述
    //           "limitDesc":"仅限团购用户使用",  //限制描述
    //           "showUseful":1,               //当前场次是否可用
    //           "unUsefulReason":"首购只限用一张", // 优惠券不可用原因
    //           "source": 1,                  //客户端请在支付的时候提交这个字段
    //         },
    //     ],
    //     "chosenMaoyanCoupon":[
    //           {
    //             "code": "232323", //券码
    //             "source": 1       //来源，计算价格的时候需要提交
    //           },
    //           {
    //             "code": "2444",
    //             "source": 1
    //           }
    //     ]
    //   };
    //   // mock 商家券
    //   let merchantCouponCell = data.priceCells.find(c => c.name === 'merchantCoupon');
    //   if (merchantCouponCell == null) {
    //     merchantCouponCell = {
    //       name: 'merchantCoupon',
    //       display: '商家券'
    //     };
    //   }
    //   merchantCouponCell.ext = {
    //     "desc":"减免10元",
    //     "voucherCouponMax": 1,  //代金券最大使用张数
    //     "availableList": [
    //       {
    //         "type": 1,                     //优惠券类型：1 代金券，2通兑券
    //         "title": "猫眼电影",            //代金券标题
    //         "code": "69766766",           //代金券验证码
    //         "subType": "2D",              //券类型是通兑券时，表示通兑券的类型，如2D、IMAX、2D3D通用等
    //         "value": 1.00,                //券类型是代金券时，表示代金券的金额
    //         "endTime":0,                  //过期时间
    //         "leftDesc":"3天后过期",        //过期描述
    //         "limitDesc":"仅限团购用户使用",  //限制描述
    //         "showUseful":1,               //当前场次是否可用
    //         "unUsefulReason":"首购只限用一张", // 优惠券不可用原因
    //         "source": 1,                  //客户端请在支付的时候提交这个字段
    //       },
    //     ],
    //     "chosenMerchantCoupon":[
    //       {
    //         "code":"23242",
    //         "source": 2
    //       }
    //     ]
    //   };

    // // mock 多行退改签规则提示
    // data.refundMigrateTip = data.refundMigrateTip.concat(data.refundMigrateTip).concat(data.refundMigrateTip);

    // this.setData(data);
    // this.updateHelpInputPhoneButton()
    // this.emit('tickpayleft');
    // });
    // 订单倒计时
    listen(this, 'tickpayleft', function () {
      clearTimeout(timerPayLeft);
      var _data = _this.data,
          modalHidden = _data.modalHidden,
          timeover = _data.timeover,
          payEndDate = _data.payEndDate;

      payEndDate = _this.payEndDate;
      if (payEndDate) {
        var timeleft = payEndDate - new Date() * 1;
        _this.data.sendParam.endTime = timeleft;
        _this.setData({sendParam:_this.data.sendParam});
        if (timeleft <= 0) {
          timeleft = 0;
          modalHidden = false;
          timeover = true;
        }
        _this.setData({
          timeleft: Date2(timeleft).toString('mm:ss'),
          modalHidden: modalHidden,
          timeover: timeover
        });
      }
      if (!timeover) {
        timerPayLeft = setTimeout(function () {
          return _this.emit('tickpayleft');
        }, 1000);
      }
    });

    // this.emit('refreshorderdata'); // 开始请求订单
  },
  navSuccess: function(res){
    console.log('success',res);
  },
  navFail: function(res){
    console.log('fail',res);
  },
  getGoodslist: function getGoodslist(list) {
    var _this2 = this;

    var availableList = [],
        cards = [],
        redPacket = [];
    var goodsDetailEntities = list;

    var len = goodsDetailEntities.length;
    goodsDetailEntities.map(function (item) {
      item.checked = false;
      if (item.goodsType == 1) {
        item.value = item.amount / 100;
        item.type = 1;
        item.name = item.goodsName;
        item.giftSubDesc = item.goodsDescription;
        item.expireDesc = '\u4F59\u989D\uFF1A' + item.availableBalance / 100 + '\u5143';
        item.statusDesc = item.validDays + '\u5929\u540E\u8FC7\u671F\u6548';
        item.startTime = date.fomateDate(item.startTimeValue);
        item.endTime = date.fomateDate(item.endTimeValue);
        cards.push(item);
      } else if (item.goodsType == 2) {
        // item.goodsDescription = '仅限《蚁人2：黄蜂女现身》使用';
        item.startTime = date.fomateDate(item.startTimeValue);
        item.endTime = date.fomateDate(item.endTimeValue);
        item.availableBalance = _this2.data.order.unitPrice + _this2.data.order.seatServiceFee;
        availableList.push(item);
      } else if (item.goodsType == 3) {
        item.startTime = date.fomateDate(item.startTimeValue);
        item.endTime = date.fomateDate(item.endTimeValue);
        redPacket.push(item);
      }
    });
    _this2.setData({
      availableList: availableList,
      cards: cards,
      redPacket: redPacket
    });
  },
  updateCode: function updateCode() {
    var _this3 = this;

    delete this.data.code;
    app.wx2promiseify(wx.login).then(function (res) {
      _this3.setData({
        code: res.code
      });
      _this3.updateHelpInputPhoneButton();
    });
  },
  fetchOrder: function fetchOrder() {
    var options = this.options;

    if (app._orderInfo) {
      var orderInfo = app._orderInfo;
      delete app._orderInfo;
      return Promise.resolve(orderInfo);
    }

    return app.request().post(PROD ? '/proxy/order/v9/order/' + options.orderId + '/unpaid.json' : '/proxy/api/order/v9/order/' + options.orderId + '/unpaid.json').header({
      'content-type': 'application/x-www-form-urlencoded',
      token: app.$user.token,
      'x-ta': '1',
      'x-host': PROD ? 'http://maoyanapi.vip.sankuai.com' : 'http://api.be.movie.st.sankuai.com'
    }).send({
      channelId: app.channelId,
      clientType: 'wechat_small_program',
      orderSource: 'movie'
    }).header('token', app.$user.token).end().then(function (res) {
      return res.body.data;
    });
  },
  onShow: function onShow() {
    this.emit('tickpayleft');
  },
  onHide: function onHide() {
    clearTimeout(timerPayLeft);
  },

  // 会员折扣卡
  onGuideDiscountCard: function onGuideDiscountCard(e) {
    var guidelink = e.currentTarget.dataset.guidelink;
    /*
    meituanmovie://www.meituan.com/web?url=http://m.maoyan.com/membercard/detail/1245526?_v_=yes&version=4&seatOrderId=723323102
    */

    var eMemberCardId = /%2Fmembercard%2Fdetail%2F(\d+)/.exec(guidelink)[1];
    wx.redirectTo({
      url: '/pages/membercard/index?eMemberCardId=' + eMemberCardId + '&seatOrderId=' + this.data.id
    });
  },
  onSwitchDiscountCard: function onSwitchDiscountCard(e) {
    this.refreshPrice({
      data: {
        cellName: 'discountCard',
        withDiscountCard: e.detail.value
      }
    });
  },
  showActiveDlg: function(){
    this.setData({hiddenActiveDlg:false});
  },
  hideActiveDlg: function(){
    this.setData({hiddenActiveDlg:true});
  },

  // 活动与抵用券
  onTapMaoyanActivityAndCoupon: function onTapMaoyanActivityAndCoupon() {
    // this.maoyanActivityAndCoupon.emit('setdata');
    this.maoyanActivityAndCoupon.show();
  },
  onTapMaoyanActivityItem: function onTapMaoyanActivityItem() {
    var maoyanActivityAndCoupon = this.data.maoyanActivityAndCoupon;

    this.refreshPrice({
      data: {
        withActivity: !maoyanActivityAndCoupon.maoyanActivity.withActivity,
        cellName: 'maoyanActivityAndCoupon'
      }
    });
  },
  onTapMaoyanCouponItem: function onTapMaoyanCouponItem(e) {
    //如果已选择积分
    if(this.goodsType == -1){
      this.toast('已选择积分，需要取消才能使用');
      return;
    };

    if (this.goodsType == 0 || this.goodsType == 1) {
      var cards = this.data.cards;
      var _e$currentTarget$data = e.currentTarget.dataset,
          index = _e$currentTarget$data.index,
          checked = _e$currentTarget$data.checked;

      var selectCardsLen = cards.filter(function (c) {
        return c.checked;
      }).length;

      if (selectCardsLen > 0 && !cards[index].checked) {
        this.toast('最多只能使用一个观影卡');
        return;
      }
      // if(this.seatsLen <= selectAvailableLen && !checked) return;


      // let available = cards[index];

      cards.map(function (item, idx) {
        if (idx == index) {
          if (item.checked) {
            item.checked = false;
          } else {
            item.checked = true;
          }
        }
      });
      selectCardsLen = cards.filter(function (c) {
        return c.checked;
      }).length;
      if (selectCardsLen > 0) {
        this.goodsType = 1;
      } else {
        this.goodsType = 0;
      }
      this.setData({
        cards: cards,
        checkedText: selectCardsLen > 0 ? '\u5DF2\u9009\u62E9' + selectCardsLen + '\u7535\u5F71\u5361' : '',
        goodsType: this.goodsType
      });
    } else {
      this.toast('\u5DF2\u9009\u62E9' + (this.goodsType == 2 ? '兑换券' : '红包') + ',\u9700\u8981\u53D6\u6D88\u624D\u80FD\u9009\u62E9\u7535\u5F71\u5361');
    }
    // let toast, checked;
    // let { maoyanActivityAndCoupon } = this.data;
    // let i = e.currentTarget.dataset.index;
    // let c = maoyanActivityAndCoupon.availableList[i];
    // if(!c.showUseful) {
    //   toast = c.unUsefulReason;
    // }else{
    //   checked = !c.checked;
    //   if(checked) {
    //     toast = this.checkCoupons(c, maoyanActivityAndCoupon);
    //   }
    // }

    // if(toast){
    //   this.toast(toast)
    // }else{
    //   maoyanActivityAndCoupon.availableList[i].checked = checked;
    //   this.maoyanActivityAndCoupon.emit('refreshCheckedText', maoyanActivityAndCoupon);
    //   this.setData({ maoyanActivityAndCoupon })
    // }
  },
  updateHelpInputPhoneButton: function updateHelpInputPhoneButton() {
    var data = this.data;
    if (data.code && data.order && data.order.id && !data.order.mobilePhone && !app.get('has-help-input-phone')) {
      data.isShowHelpInputPhone = true;
    } else {
      data.isShowHelpInputPhone = false;
    }
    this.setData(data);
  },
  onTapHelpInputPhone: function onTapHelpInputPhone(e) {
    var _this4 = this;

    var _e$detail = e.detail,
        encryptedData = _e$detail.encryptedData,
        iv = _e$detail.iv;

    app.request().get('/wechat/wxapp/phone').query({
      code: this.data.code,
      encryptedData: encryptedData,
      iv: iv
    }).end().then(function (res) {
      _this4.data.order.mobilePhone = res.body.phoneNumber;

      app.setMobile(res.body.phoneNumber);
      app.set('has-help-input-phone', 1);

      _this4.setData({
        order: _this4.data.order
      });
    }).catch(function () {}).then(function () {
      _this4.updateCode();
    });
  },

  // 优惠券使用规则检测
  checkCoupons: function checkCoupons(coupon, ext) {
    var _data2 = this.data,
        n = _data2.order.seats.count,
        maoyanActivityAndCoupon = _data2.maoyanActivityAndCoupon,
        merchantCoupon = _data2.merchantCoupon;

    if (maoyanActivityAndCoupon == null) {
      this.maoyanActivityAndCoupon.emit('setdata');
      maoyanActivityAndCoupon = this.data.maoyanActivityAndCoupon;
    }
    if (merchantCoupon == null) {
      this.merchantCoupon.emit('setdata');
      merchantCoupon = this.data.merchantCoupon;
    }
    var checked = function checked(c) {
      return c.checked;
    };
    var type1 = function type1(c) {
      return c.type === 1;
    };
    var type2 = function type2(c) {
      return c.type === 2;
    };

    // 已选 优惠券
    var couponsMaoyan = maoyanActivityAndCoupon.availableList.filter(checked);
    // 已选 商家优惠券
    var couponsMerchant = merchantCoupon.availableList.filter(checked);
    // 已选 优惠券总数
    var count = couponsMaoyan.length + couponsMerchant.length;
    // 已选 代金券总数
    var countType1 = couponsMaoyan.concat(couponsMerchant).filter(type1).length;
    // 已选 通兑券总数
    var countType2 = couponsMaoyan.concat(couponsMerchant).filter(type2).length;

    if (count > n) {
      return '\u6BCF\u7B14\u8BA2\u5355\u6700\u591A\u4F7F\u7528' + (n + 1) + '\u5F20\u5238';
    }

    if (coupon.type === 1) {
      // 代金券
      if (countType2 >= n) {
        return '\u60A8\u5DF2\u9009\u62E9\u4E86' + n + '\u5F20\u901A\u5151\u5238, \u4E0D\u80FD\u7EE7\u7EED\u4F7F\u7528';
      }
      if (ext === maoyanActivityAndCoupon) {
        if (couponsMaoyan.filter(type1).length >= maoyanActivityAndCoupon.voucherCouponMax) {
          return '\u6BCF\u7B14\u8BA2\u5355\u9650\u7528' + maoyanActivityAndCoupon.voucherCouponMax + '\u5F20\u4EE3\u91D1\u5238';
        }
      } else if (ext === merchantCoupon) {
        if (couponsMerchant.filter(type1).length >= merchantCoupon.voucherCouponMax) {
          return '\u6BCF\u7B14\u8BA2\u5355\u9650\u7528' + merchantCoupon.voucherCouponMax + '\u5F20\u5546\u5BB6\u4EE3\u91D1\u5238';
        }
      }
    } else if (coupon.type === 2) {
      // 通兑券
      if (countType1 === 0) {
        if (countType2 >= n) {
          return '\u6700\u591A\u4F7F\u7528' + n + '\u5F20\u901A\u5151\u5238';
        }
      } else {
        if (countType2 >= n - 1) {
          return '请先取消勾选的代金券, 才能继续使用';
        }
      }
    }
    // 无违反规则的情况
  },
  onTapConfirmMaoyanActivityAndCoupon: function onTapConfirmMaoyanActivityAndCoupon(e) {
    var _this5 = this;

    this.refreshPrice({
      data: {
        cellName: 'maoyanActivityAndCoupon'
      },
      success: function success() {
        _this5.maoyanActivityAndCoupon.hide();
      }
    });
  },

  // 优惠券绑定
  onInputMagicCard: function onInputMagicCard(e) {
    var magiccard = e.detail.value;

    this.setData({ magiccard: magiccard });
  },
  onTapBindMagicCard: function onTapBindMagicCard(e) {
    var _this6 = this;

    var availableList = this.data.availableList;
    var index = e.detail.index;

    var available = availableList[index];
    availableList.map(function (item) {
      if (item.checked) {
        item.checked = false;
      } else {
        item.checked = true;
      }
    });

    return;
    var _data3 = this.data,
        id = _data3.id,
        magiccard = _data3.magiccard;

    this.setData({ magiccardValue: magiccard });
    app.request().post(PROD ? '/proxy/order/v9/order/' + id + '/bind/magiccard.json' : '/proxy/api/order/v9/order/' + id + '/bind/magiccard.json').header({
      'content-type': 'application/x-www-form-urlencoded',
      token: app.$user.token,
      'x-ta': '1',
      'x-host': PROD ? 'http://maoyanapi.vip.sankuai.com' : 'http://api.be.movie.st.sankuai.com'
    }).header('token', app.$user.token).send({
      code: magiccard,
      orderSource: 'movie',
      channelId: app.channelId,
      clientType: 'wechat_small_program'
    }).end().then(function (_ref) {
      var data = _ref.body.data;

      if (data.bind && !data.bind.success) {
        throw new Error(data.bind.failReason);
      }
      if (data.price) {
        _this6.emit('setorderdata', data.price);
        var maoyanActivityAndCoupon = _this6.data.maoyanActivityAndCoupon;

        _this6.maoyanActivityAndCoupon.emit('setdata', maoyanActivityAndCoupon.availableList.reduce(function (prev, _ref2) {
          var checked = _ref2.checked,
              code = _ref2.code,
              source = _ref2.source;

          if (checked) {
            prev.push({ code: code, source: source });
          }
          return prev;
        }, []));
        _this6.setData({ magiccardValue: '' });
      }
    }).catch(function (err) {
      _this6.setData({ magiccardValue: '' });
      _this6.handleError(err);
    });
  },

  // 商家券
  onTapMerchantCoupon: function onTapMerchantCoupon(e) {
    // this.merchantCoupon.emit('setdata');
    var goodsType = e.currentTarget.dataset.goodstype,
        data = this.data,
        couponList = [];

    switch (goodsType * 1) {
      case 1:
        couponList = data.cards;
        break;
      case 2:
        couponList = data.availableList;
        break;
      case 3:
        couponList = data.redPacket;
        break;
    }
    this.setData({
      couponList: couponList,
      selectGoodsType: goodsType
    });
    this.merchantCoupon.show();
  },
  onTapMerchantCouponItem: function onTapMerchantCouponItem(e) {
    //1,卡; 2,兑换码; 3,红包;
    if(this.goodsType == -1){
      this.toast('已选择积分，需要取消才能使用');
      return;
    }
    if (this.goodsType == 0 || this.goodsType == 2 || this.goodsType == 3) {
      var _data4 = this.data,
          availableList = _data4.availableList,
          redPacket = _data4.redPacket,
          couponList = _data4.couponList;
      var _e$currentTarget$data2 = e.currentTarget.dataset,
          index = _e$currentTarget$data2.index,
          checked = _e$currentTarget$data2.checked,
          selectGoodsType = _e$currentTarget$data2.selectgoodstype;

      var selectAvailableLen = void 0,
          typeTxt = '';
      if (selectGoodsType == 2) {
        if (this.goodsType == 3) {
          this.toast('\u5DF2\u9009\u62E9\u7EA2\u5305,\u9700\u8981\u53D6\u6D88\u624D\u80FD\u9009\u62E9');
          return;
        }
        selectAvailableLen = availableList.filter(function (c) {
          return c.checked;
        }).length;
        typeTxt = '兑换券';
        if (this.seatsLen <= selectAvailableLen && !checked) {
          this.toast('一个座位只能使用一张兑换券');
          return;
        }
      } else if (selectGoodsType == 3) {
        if (this.goodsType == 2) {
          this.toast('\u5DF2\u9009\u62E9\u5151\u6362\u5238,\u9700\u8981\u53D6\u6D88\u624D\u80FD\u9009\u62E9');
          return;
        }
        selectAvailableLen = redPacket.filter(function (c) {
          return c.checked;
        }).length;
        typeTxt = '红包';
        if (selectAvailableLen > 0 && !redPacket[index].checked) {
          this.toast('最多只能使用一个红包');
          return;
        }
      }

      if (selectGoodsType == 2) {

        availableList.map(function (item, idx) {
          if (idx == index) {
            if (item.checked) {
              item.checked = false;
            } else {
              item.checked = true;
            }
          }
        });
        couponList = availableList;
        selectAvailableLen = availableList.filter(function (c) {
          return c.checked;
        }).length;
        if (selectAvailableLen > 0) {
          this.goodsType = 2;
        } else {
          this.goodsType = 0;
        }
      } else if (selectGoodsType == 3) {

        redPacket.map(function (item, idx) {
          if (idx == index) {
            if (item.checked) {
              item.checked = false;
            } else {
              item.checked = true;
            }
          }
        });
        couponList = redPacket;
        selectAvailableLen = redPacket.filter(function (c) {
          return c.checked;
        }).length;
        if (selectAvailableLen > 0) {
          this.goodsType = 3;
        } else {
          this.goodsType = 0;
        }
      }

      this.setData({
        couponList: couponList,
        redPacket: redPacket,
        availableList: availableList,
        checkedText: selectAvailableLen > 0 ? '\u5DF2\u9009\u62E9' + selectAvailableLen + typeTxt : '',
        goodsType: this.goodsType
      });
    } else {
      this.toast('\u5DF2\u9009\u62E9\u7535\u5F71\u5361,\u9700\u8981\u53D6\u6D88\u624D\u80FD\u9009\u62E9');
      // this.toast(`已选择${this.goodsType == 1 ? '兑换券' : '红包'},需要取消才能选择电影卡`)
    }
  },
  onTapConfirmMerchantCoupon: function onTapConfirmMerchantCoupon(e) {
    var _this7 = this;

    var selectGoodsType = _this7.data.selectGoodsType;

    this.refreshPrice({
      data: {
        cellName: selectGoodsType == 2 ? 'merchantCoupon' : 'merchantRedPacket'
      },
      success: function success() {
        _this7.merchantCoupon.hide();
      }
    });
  },
  switchCheckPointsCatch: function (e) {
    if (this.goodsType == 1) {
      this.toast('已选择观影卡，需要取消才能使用积分');
    } else if (this.goodsType == 2) {
      this.toast('已选择兑换码，需要取消才能使用积分');
    } else if (this.goodsType == 3) {
      this.toast('已选择红包，需要取消才能使用积分');
    }
  },
  switchCheckPoints: function (e) {
    var check = e.detail.value,
        num = e.currentTarget.dataset.num,
        order = this.data.order;
    if (check) {
      order.totalPrice -= num;
      this.goodsType = -1;
      this.setData({
        order: order
      });
    } else {
      order.totalPrice = this._totalPrice;
      this.goodsType = 0;
      this.setData({
        order: order
      });
    }
  },

  // 刷新价格
  refreshPrice: function refreshPrice(_ref3) {
    var that = this,
        data = _ref3.data,
        success = _ref3.success,
        fail = _ref3.fail;
    var _data5 = this.data,
        order = _data5.order,
        availableList = _data5.availableList,
        cards = _data5.cards,
        redPacket = _data5.redPacket,
        allList = availableList.concat(cards, redPacket),
        isChecked = false;

    var selectList = void 0;
    if (data.cellName == 'merchantCoupon') {
      selectList = availableList.filter(function (c) {
        return c.checked;
      });
    } else if (data.cellName == 'maoyanActivityAndCoupon') {
      selectList = cards.filter(function (c) {
        return c.checked;
      });
    } else if (data.cellName == 'merchantRedPacket') {
      selectList = redPacket.filter(function (c) {
        return c.checked;
      });
    }
    console.log('selectList',selectList);
    if (selectList.length > 0) {
      var totalMinus = 0;
      selectList.map(function (item) {
        totalMinus += item.availableBalance
      });
      order.totalPrice = that._totalPrice - totalMinus > 0 ? that._totalPrice - totalMinus : 0 ;
      this.setData({
        order: order
      });
      if(this.goodsType != 0){
        this.setData({disSwitch: true});
      }
    } else {
      isChecked = allList.some(function(item){return item.checked});
      if(!isChecked){
        order.totalPrice = this._totalPrice;
        this.setData({
          order: order
        });
      }
      if(this.goodsType == 0){
        this.setData({disSwitch: false});
      }
    }
    if(order.totalPrice == 0){
      this.setData({submitBtnName:'立即支付'});
    }else{
      this.setData({submitBtnName:'确认订单'});
    }
    success && success();
  },
  onTapMobilePhoneLabel: function onTapMobilePhoneLabel() {
    this.setData({ inputFocus: true });
  },
  onTouchStartSubmit: function onTouchStartSubmit(e) {
    // 保存点击事件以用于收集风控信息
    // this.pmsWechatRisk = new Promise(resolve => {
    //   risk.params(e, resolve);
    // });
  },

  // 发起支付
  onSubmit: function onSubmit() {
    var _this8 = this;

    var _data6 = this.data,
        availableList = _data6.availableList,
        redPacket = _data6.redPacket,
        cards = _data6.cards,

        selectAvailable = availableList.filter(function (c) {
          return c.checked;
        }),
        selectRedPacket = redPacket.filter(function (c) {
          return c.checked;
        }),
        selectCards = cards.filter(function (c) {
          return c.checked;
        }),
        numbers = [],
        goodsType = 0;

    if (selectAvailable.length > 0) {
      goodsType = 2;
      selectAvailable.map(function (item) {
        numbers.push(item.number);
      });
    } else if (selectCards.length > 0) {
      goodsType = 1;
      selectCards.map(function (item) {
        numbers.push(item.number);
      });
    } else if (selectRedPacket.length > 0) {
      goodsType = 3;
      selectRedPacket.map(function (item) {
        numbers.push(item.number);
      });
    } else if (_this8.goodsType == -1) {
      goodsType = 4;
    }
    console.log('goodsType',goodsType);
    console.log('numbers',numbers);

    wx.showLoading({title:'确认中'});
    app.request().post('/order/payment').query({
      'ticketOrderId': this.orderId,
      'goodsType': goodsType,
      'numbers': numbers.join(),
      'payType': 2
    }).end().then(function (res) {
      wx.hideLoading();
      if (res.body.code == 0) {
        var data = res.body.data;
        console.log('data',data);
        // if(data.jumpPiaoyouPay){
        //   wx.hideLoading();
        //   _this8.data.sendParam.price = data.thirdPartyPaymentAmount / 100;
        //   _this8.setData({
        //     isConfirmPay:true,
        //     deductionAmount:data.deductionAmount
        //   });
        // } else {
        //   wx.redirectTo({
        //     url: '../order/orderdraw?ticketOrderId=' + _this8.orderId
        //   })
        // }
        tt.requestPayment({
          data: {
            app_id: data.toutiaoPayAppId,
            method: 'tp.trade.confirm',
            sign: data.toutiaoSign,
            sign_type: 'MD5',
            timestamp: data.millisecondTimeSpan.toString(),
            trade_no: data.toutiaoTradeNo,
            merchant_id: data.toutiaoMerchantId,
            uid: data.openId,
            total_amount: data.orderAmount,
            pay_channel: 'ALIPAY_NO_SIGN',
            pay_type: 'ALIPAY_APP',
            risk_info: JSON.stringify({
              ip: '127.0.0.1'
            }),
            params: JSON.stringify({
              url: data.alipayParams
            }),
          },
          success(res) {
            console.log('支付成功:', res)
            wx.redirectTo({
              url: '../order/orderdraw?ticketOrderId=' + _this8.orderId
            })
          },
          fail(res){
            console.log('fail',res);
          }
        })
      } else {
        wx.hideLoading();
        _this8.toast(res.body.msg);
      }
      // console.log(this.selectSeat)
    }).catch(function (err) {
      _this8.loading(false);
      // this.toast(`锁座失败，请重试`);
    });
  },

  // onSubmit: app.noRepeatPromise(function (e) {
  //   const that = this
  //   let {
  //     id: orderId,
  //     order: { mobilePhone },
  //     priceCells,
  //     pricePackage: { priceType },
  //   } = this.data;
  //   if (!mobilePhone) {
  //     this.setData({
  //       modalHidden: false,
  //       modalText: '请输入购票手机号',
  //     });
  //     return;
  //   } else if (!/^1\d{10}$/.test(mobilePhone)) {
  //     this.setData({
  //       modalHidden: false,
  //       modalText: '请输入正确的11位手机号',
  //     });
  //     return;
  //   }
  //   let couponCodes = priceCells.reduce((prev, { name, ext }) => {
  //     if (name === 'maoyanActivityAndCoupon') {
  //       Array.prototype.push.apply(prev, ext.chosenMaoyanCoupon);
  //     } else if (name === 'merchantCoupon') {
  //       Array.prototype.push.apply(prev, ext.chosenMerchantCoupon);
  //     }
  //     return prev;
  //   }, [])
  //   return Promise.all([this.pmsWechatRisk, app.uuid()]).then(([wechatRiskParams, uuid]) => {
  //     return app.request()
  //       .post('/proxy/noncashier/pay.do')
  //       .header({
  //         'x-ta': '1',
  //         token: app.$user.token,
  //         'x-host': PROD_PAY ?
  //           'http://maoyanpay.vip.sankuai.com' :
  //           'http://api.be.movie.st.sankuai.com',
  //       })
  //       // .query({ uuid })
  //       .send({
  //         order_id: orderId,
  //         price_type: priceType,
  //         user_phone: mobilePhone,
  //         coupon_codes: JSON.stringify(couponCodes),
  //         channelId: app.channelId,
  //         clientType: 'wechat_small_program',
  //         // pointCardCode: // TODO 点卡密码, 暂未用到的参数
  //         openid: app.$user.openId,
  //         wxAppChannelId: app.wxAppChannelId || 1, // 微信appId渠道 1-猫眼, 2-美团 3-点评
  //         wechatRiskParams,
  //         deviceInfoByQQ: app.deviceInfoByQQ(),
  //         uuid,
  //       })
  //       .end()
  //   })
  //   .then(({ body }) => {
  //     if (!body) {
  //       throw new Error('系统繁忙，稍后再试');
  //     }
  //     let { data, url } = body;

  //     app.$user.mobile || app.setMobile(mobilePhone)

  //     let success = () => {
  //       this.stats('pay', 'paysuccess', {
  //         order_id: orderId
  //       });
  //       app.formId = e.detail.formId
  //       wx.redirectTo({
  //         url: `./order?orderId=${orderId}${this.data.migrate.migrating ? '&migratesuccess=true' : ''}&showPopup=true`,
  //       });
  //     }
  //     if (url) {
  //       // 如果不需要现金支付，则返回以下结果，客户端直接跳转到支付成功页面即可
  //       success();
  //     } else {
  //       return new Promise((resolve, reject) => {
  //         wx.requestPayment({
  //           ...JSON.parse(data.url),
  //           success,
  //           complete: (res) => {
  //             resolve(res)
  //           },
  //         });
  //       })

  //       // 调试用代码，因为在模拟器下无法完成支付
  //       // wx.redirectTo({ url: `/pages/order/order?orderId=${orderId}` });
  //     }
  //   })
  //   .catch(err => {
  //     // if (err && err.res && err.res.data.error.type === 'err_order_pay_risk') {
  //     if (err && err.res && err.res.data && err.res.data.error && err.res.data.error.message) {
  //       wx.showModal({
  //         content: err.res.data.error.message,
  //         showCancel: false,
  //         confirmText: '知道了',
  //         success() {
  //           wx.redirectTo({
  //             url: './buy?' + app.queryStringify(that.options),
  //           });
  //         },
  //       });
  //     } else {
  //       this.handleError(err)
  //     }
  //   });
  // }),
  onALiPay: () => {
    console.log('alipay')
  },
  onInputMobile: function onInputMobile(e) {
    this.data.order.mobilePhone = e.detail.value;
  },
  onChangeMobile: function onChangeMobile(e) {
    this.setData({
      inputFocus: false,
      inputError: !/^1\d{10}$/.test(e.detail.value)
    });
  },
  onModalConfirm: function onModalConfirm() {
    var data = { modalHidden: true };
    if (this.data.timeover) {
      data.timeover = false;
      wx.navigateBack();
    }
    this.setData(data);
  },
  togglePanel: function togglePanel() {
    this.setData({
      panelExpand: !this.data.panelExpand
    });
  },
  doNothing: function doNothing() {}
});

function joinText(prefix, arr) {
  var ret = arr.reduce(function (prev, _ref4) {
    var value = _ref4.value,
        _ref4$separator = _ref4.separator,
        separator = _ref4$separator === undefined ? '' : _ref4$separator,
        text = _ref4.text;

    if (value) {
      return prev + (prev ? separator : '') + text.replace(/\$value/g, value);
    }
    return prev;
  }, '');
  return ret ? prefix + ret : '';
}

function listen(obj, name, listener) {
  var mapListener = void 0;
  if (typeof obj.emit === 'undefined') {
    mapListener = {};
    obj.emit = function (name) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var _listener = mapListener[name];
      if (typeof _listener === 'function') {
        _listener.apply(obj, args);
      }
    };
    obj.emit.__mapListener = mapListener;
  }
  mapListener = obj.emit.__mapListener;
  mapListener[name] = listener;
}
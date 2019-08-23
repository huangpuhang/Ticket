'use strict';

var app = getApp();

var PROD = true;

app.MoviePage({
  data: {
    theme: app.$theme
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.setData(options);
    this.loading();
    this.fetchRefundData().catch(function (err) {
      return _this.handleError(err, 'page');
    }).then(function () {
      _this.loading(false);
    });
  },
  fetchRefundData: function fetchRefundData() {
    var _this2 = this;

    var orderId = this.data.orderId;

    return app.request().get('/hostproxy' + (PROD ? '' : '/api') + '/queryorder/v1/refunddetail.json').header({
      token: app.$user.token

    }).query({
      token: app.$user.token,
      orderId: orderId
    }).end().then(function (res) {
      var _res$body$data = res.body.data,
          refundInfo = _res$body$data.refundInfo,
          myProgress = _res$body$data.myProgress,
          mtProgresses = _res$body$data.mtProgresses;
      var totalMoney = refundInfo.totalMoney,
          cashierMoney = refundInfo.cashierMoney,
          refundFee = refundInfo.refundFee,
          cashierDetails = refundInfo.cashierDetails,
          couponMoney = refundInfo.couponMoney,
          withPointCard = refundInfo.withPointCard,
          pointCardNum = refundInfo.pointCardNum,
          pointCardNoSuffix = refundInfo.pointCardNoSuffix;

      var refundTime = [];
      var mySteps = myProgress || [];
      var mtSteps = mtProgresses || [];
      var accountsList = [];
      var processTitle = [];
      if (!!couponMoney) {
        accountsList.push(couponMoney / 100 + '\u5143\u4EE3\u91D1\u5238\u76F4\u63A5\u8FD4\u56DE\u7528\u6237\u8D26\u6237');
      }
      if (!!withPointCard) {
        accountsList.push('' + (!!pointCardNum ? pointCardNum + '\u70B9\u9000\u56DE\u793C\u54C1\u5361' : '') + (!!pointCardNoSuffix ? '(\u5C3E\u53F7' + pointCardNoSuffix + ')' : ''));
      }
      if (!!cashierMoney && !!cashierDetails) {
        var isMultiRefund = cashierDetails.length > 1;
        if (!isMultiRefund) {
          // 单笔退款
          var _cashierDetails$ = cashierDetails[0],
              toAccounts = _cashierDetails$.toAccounts,
              time = _cashierDetails$.time;

          if (!!toAccounts && !!toAccounts.length) {
            if (toAccounts.length === 1 && (!!couponMoney || withPointCard)) {
              accountsList.push('\u5269\u4F59\u91D1\u989D\u9000\u56DE' + toAccounts[0]);
            } else {
              toAccounts.map(function (account) {
                accountsList.push(account);
              });
            }
          }
          refundTime.push(time);
        } else {
          // 多笔退款
          accountsList.push(cashierMoney / 100 + '\u5143\u5206' + cashierDetails.length + '\u7B14\u8FD4\u56DE');
          cashierDetails.map(function (node, index) {
            accountsList.push('\u7B2C' + (index + 1) + '\u7B14\uFF1A' + node.toAccounts.join(','));
            processTitle.push('\u7B2C' + (index + 1) + '\u7B14\uFF1A' + node.toAccounts.join(','));
            refundTime.push('\u7B2C' + (index + 1) + '\u7B14\uFF1A' + node.time);
          });
        }
      }

      if (mtSteps.length > 1) {
        mtSteps.map(function (progress, index) {
          progress.text = processTitle[index];
          progress.progresses[0].nodes.map(function (node) {
            node.desc = node.desc.length ? node.desc.join('').replace(/<\/?span>/g, '') : '';
          });
          progress.nodes = progress.progresses[0].nodes;
          return progress;
        });
      } else if (mtSteps.length === 1) {
        mySteps = (mySteps.slice(0, mySteps.length - 1) || []).concat(mtSteps[0].progresses[0].nodes);
      }
      mySteps.map(function (progress) {
        progress.desc = progress.desc.length ? progress.desc.join('').replace(/<\/?span>/g, '') : '';
      });
      var data = {
        totalMoney: {
          info: '退款金额',
          isMoney: true,
          value: !!totalMoney,
          text: totalMoney / 100 + '\u5143',
          remarks: '' + (!!refundFee ? '\uFF08\u5DF2\u6263\u9664\u624B\u7EED\u8D39' + refundFee / 100 + '\u5143\uFF09' : ''),
          isFirst: true
        },
        promoDetail: {
          info: '退款说明',
          value: !!cashierDetails && !!(cashierDetails.filter(function (node) {
            return node.promoDetail;
          }).length > 0),
          text: '' + (!!cashierDetails && !!(cashierDetails.filter(function (node) {
            return node.promoDetail;
          }).length > 0) ? cashierDetails.map(function (node) {
            return node.promoDetail;
          }).join('，') : '')
        },
        accounts: {
          info: '退回账户',
          value: accountsList.length && (!!cashierMoney || !!couponMoney) || !!withPointCard,
          isList: true,
          textList: accountsList
        },
        time: {
          info: '到账时间',
          value: refundTime.length,
          isList: true,
          textList: refundTime
        },
        process: {
          mySteps: mySteps,
          mtSteps: mtSteps
        }
      };
      _this2.setData(data);
    });
  },
  onShow: function onShow() {
    var _this3 = this;

    // 页面显示
    // 退款详情页定时刷新状态
    var count = 0;
    this.data.interval = setInterval(function () {
      if (count >= 10) {
        clearInterval(_this3.data.interval);
      } else {
        count++;
        _this3.fetchRefundData();
      }
    }, 3000);
  },
  onHide: function onHide() {
    // 页面隐藏
    clearInterval(this.data.interval);
  },
  onUnload: function onUnload() {
    // 页面关闭
    clearInterval(this.data.interval);
  },
  phoneCall: function phoneCall(e) {
    wx.makePhoneCall({
      phoneNumber: e.target.dataset.num
    });
  }
});
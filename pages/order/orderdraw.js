// pages/city/city.js

var app = getApp();
var Date2 = require('../../scripts/date2.js');
app.MoviePage({
	data: {
		hiddenWrap: true,
		orderStatus: 0,
		orderInfo:{}
	},
	onLoad: function (options) {
		// 页面初始化 options为页面跳转所带来的参数
		let that = this;
		this.ticketOrderId = options.ticketOrderId;
		this.index = 0;
		wx.showLoading({title:'加载中'});
		this.loadData();
	},
	loadData() {
		if (this.index < 300) {
			let that = this;
			app.request().get('/order/info').query({
				'ticketOrderId':that.ticketOrderId
			}).end().then(function(res){
				var orderInfo = res.body.data;
				orderInfo.showtime = Date2(orderInfo.showtime).toString('EMM-dd HH:mm');
				that.setData({
					hiddenWrap: false,
					orderInfo: orderInfo
				});
				wx.hideLoading();
				if (res.body.code == 0) {
					if (orderInfo.status == 100) {
						that.setData({
							orderStatus: 100
						});
					} else if (orderInfo.status == 110) {
						that.setData({
							orderStatus: 110
						});
					} else {
						//轮循出票接口
						setTimeout(that.loadData, 2000);
					}
				} else {
					//轮循出票接口
					setTimeout(that.loadData, 2000);
				}
				that.index++;
			})
		}
		else {
			wx.switchTab({
				url: '../my/my'
			})
		}
	},
	onReady: function () {
		// 页面渲染完成
	},
	onShow: function () {
		// 页面显示
	},
	onHide: function () {
		// 页面隐藏
	},
	onUnload: function () {
		// 页面关闭
	},
	gotoMethod: function () {
		var orderStatus = this.data.orderStatus,
			url;
			 
		if (orderStatus == 100) {
			url = '../user/index';
		} else if (orderStatus == 110) {
			url = '../movie/index';
		}

		wx.switchTab({
			url: url
		})
	}
})
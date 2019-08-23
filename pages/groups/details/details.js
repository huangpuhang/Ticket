'use strict';

// pages/groups/details/details.js
var app = getApp();

app.MoviePage({

    /**
     * 页面的初始数据
     */
    data: {
        activityEntity: {},
        groupList: [],
        typeId: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function onLoad(options) {
        this.activityId = options.activityid;
        var typeId = options.typeid;
        this.getActivityInfo();
        this.getActivityGroup();
        if (typeId) {
            this.setData({
                typeId: parseInt(typeId)
            });
        }
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
    getActivityInfo: function getActivityInfo() {
        var _this = this;

        this.loading(true);
        app.request().get('/activity/detail').query({
            activityId: this.activityId
        }).end().then(function (res) {
            return res.body.data;
        }).then(function (data) {
            _this.loading(false);
            wx.stopPullDownRefresh();
            _this.setData({
                activityEntity: data.activityEntity
            });
        }).catch(function (err) {
            _this.loading(false);
        });
    },

    ///activity/group
    getActivityGroup: function getActivityGroup() {
        var _this2 = this;

        app.request().get('/activity/group').query({
            activityId: this.activityId
        }).end().then(function (res) {
            return res.body.data;
        }).then(function (data) {

            _this2.setData({
                groupList: data
            });
        }).catch(function (err) {
            _this2.loading(false);
        });
    },
    tapGroupListMore: function tapGroupListMore(e) {
        var groupList = this.data.groupList;

        if (groupList.length > 1) {
            this.setData({
                isGroupModal: true
            });
        }
    },
    gotoDetails: function gotoDetails(e) {
        var activityid = e.currentTarget.dataset.activityid;

        wx.navigateTo({
            url: '/pages/groups/details/details?activityid=' + activityid
        });
    },
    gotoExplain: function gotoExplain(e) {
        wx.navigateTo({
            url: '/pages/groups/explain/explain'
        });
    },
    createOrder: function createOrder() {
        var _this3 = this;

        this.loading(true);
        app.$activityEntity = this.data.activityEntity;
        app.request().post('/activity/createOrder').query({
            activityId: this.activityId,
            activityGroupId: 0
        }).end().then(function (res) {
            return res.body.data;
        }).then(function (data) {
            _this3.loading(false);
            wx.requestPayment({
                timeStamp: data.timeStamp,
                nonceStr: data.nonceStr,
                package: data.packageValue,
                signType: 'MD5',
                paySign: data.paySign,
                success: function success(res) {
                    console.log('res =====>', res);
                    wx.navigateTo({
                        url: '/pages/groups/join/join?activitygrouporderid=' + data.activityGroupOrderId
                    });
                },
                fail: function fail(res) {}
            });
        }).catch(function (err) {
            _this3.loading(false);
        });
    }
});
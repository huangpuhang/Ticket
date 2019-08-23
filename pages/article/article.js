import model from '../../scripts/model';
import _ from '../../scripts/underscore.modified';
import moment from '../../scripts/moment';
import checkMall from '../../scripts/check-mall';
moment.locale('zh-cn');

var app = getApp();
Page({
    data: {
        hiddenWrap: true,
        typeList: [],
        adState: 1,
        advertisements: [],
        hotRecommendList: [],
        newsList: [],
        hiddenTipCnt: '正在加载...'
    },
    onLoad: function (e) {
        checkMall.checkMallId(e.mallId);
        this.loadData();
    },
    loadData: function () {
        this.count = 0;
        this.pageIndex = 1;
        this.openid = 123;
        wx.showLoading({title: '加载中'});
        this.getAdvertisements();
        this.geHotRecommendList();
        this.getNewsList();
    },
    getAdvertisements: function () {
        var that = this;
        model.post("/queryAdvertisements.aspx?type=HomePageTop", {}, (result, msg) => {
            var advertisements = result.data.advertisements;
            var adState = result.data.AdState || 1;
            that.setData({
                adState: adState,
                advertisements: advertisements
            });
            that.count++;
            that.hideLoading();
        });
    },
    geHotRecommendList: function() {
        var that = this;
        model.post("/GetCustomRecommendList.aspx", {}, (result, msg) => {
            that.setData({ hotRecommendList: result.data })
            that.count++;
            that.hideLoading();
        });
    },
    getNewsList: function() {
        var that = this;
        var param = {
            pageIndex: that.pageIndex,
            openId: that.openid
        }
        that.setData({ hiddenTip: false });
        that.isLoadNext = true;
        model.post("/queryTopLineMovieNews.aspx", param, (result, msg) => {
            var newsList = result.data.news;
            _.map(newsList, function(news, index) {
                var imgs = news.images;
                var time = news.publishtime.replace(/-/g,'/');
                var time1 = new Date(time).getTime();
                var time2 = new Date() - (25 * 24 * 60 * 60 * 1000);
                if (time1 < time2) {
                    news.publishtime = '30 天前';
                } else {
                    news.publishtime = moment(news.publishtime, 'YYYY-MM-DD HH:mm:ss').fromNow();
                } 
                if (imgs && imgs.length > 1) {
                    news.isOne = false;
                } else {
                    news.isOne = true;
                }
            })
            if (newsList.length == 0) {
                that.setData({
                    hiddenTipCnt: '已经到底了'
                });
                return;
            }
            that.setData({
                newsList: that.data.newsList.concat(newsList),
                hiddenTip: true
            });
            that.count++;
            that.isLoadNext = false;
            that.hideLoading();
        });
    },
    hideLoading: function() {
        if (this.count == 3) {
            wx.hideLoading();
            this.setData({
                hiddenWrap: false
            })
        }
    },
    nextPageNews: function() {
        if (this.isLoadNext) return;
        this.pageIndex++;
        this.getNewsList();
    },
    scheduletap: function(e) {
        var movieId = e.currentTarget.dataset.movieid;
        wx.navigateTo({
            url: '../cinema/cinema?movieID=' + movieId + '&locationID=110100'
        })
    },
    recommendTap: function(e) {
        var id = e.currentTarget.dataset.id,
            type = e.currentTarget.dataset.type;
        if (type == 1) {
            wx.navigateTo({
                url: '../cinema/movie?movieId=' + id
            })
        } else {
            wx.navigateTo({
                url: './news?newsId=' + id
            })
        }
    },
    newsDetailTap: function (e) {
        var newsId = e.currentTarget.dataset.newsid;
        wx.navigateTo({
            url: './news?newsId=' + newsId
        })
    },
    onShareAppMessage: function() {
        var _mallId = wx.getStorageSync('mallId');
        return {
            title: '吾悦观影',
            path: 'pages/article/article?mallId=' + _mallId
        }
    },
})
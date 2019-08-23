import model from '../../scripts/model';
import _ from '../../scripts/underscore.modified';
import WxParse from '../../wxParse/wxParse.js';
import moment from '../../scripts/moment';
import checkMall from '../../scripts/check-mall';
moment.locale('zh-cn');

var app = getApp();
Page({
    data:{
        ishide: 1,
        hiddenWrap: true,
        hiddenLoading: false,
        showCreate: false,
        isHideNews: true,
        isWant: false,
    },
    onLoad: function(e) {
        var that = this;
        var _newsId = e.newsId ? e.newsId : decodeURIComponent(e.scene);
        checkMall.checkMallId(e.mallId);
        that.newsId = _newsId;
        that.toastTimer = null;
        var param = {
            newsID: _newsId,
            openId: 123
        }
        wx.showLoading({title:'加载中'});
        model.post('/queryMovieNewsByID.aspx', param, (result, msg) => {
            let { data } = result;
            that.setData({
                newsInfo: data.newsInfo,
                topAds: data.topAds,
                bottomAds: data.bottomAds,
                news: data.news,
                numBrowse: that.formatCount(data.newsInfo.count),
                isCollect: data.newsInfo.isCollection,
                numCollect: data.newsInfo.CollectionCount,
                isLike: data.newsInfo.isLike,
                numLike: data.newsInfo.LikeCount,
                numWant: data.bottomAds[0].movie.AttitudeCount,
                movieId: data.bottomAds[0].movie.movieID
            });
            that.getRandomNews(data.randomNews);
            WxParse.wxParse('article', 'html', that.fomateArticleContent(data.newsInfo.content), that, 5);
            wx.hideLoading();
            that.setData({
                hiddenLoading: true,
                ishide: 0,
                hiddenWrap: false
            }, function () {
                setTimeout(function() {
                    that.tagTopEvent();
                }, 500)
            })
        })
    },
    fomateArticleContent(cnt) {
        let imgs = cnt.match(/<img [^>]*src=['"]([^'"]+)[^>]*>/gi);
        let lastImg = imgs[imgs.length - 1];
        return cnt.replace(lastImg, '');
    },
    formatCount: function(num){
        var num = parseInt(num);
        return num > 9999 ? (Math.floor(num/1000)/10) + '万' : num;
    },
    getRandomNews: function (randomNews) {
        _.map(randomNews, function (news, index) {
            var imgs = news.images;
            var time = news.publishtime.replace(/-/g, '/');
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
        this.setData({
            randomNews: randomNews
        });
    },
    tagTopEvent: function () {
        var that = this;
        wx.createSelectorQuery().selectAll('.wxParse-img').boundingClientRect(function (rect) {
            // rect.id      // 节点的ID
            // rect.dataset // 节点的dataset
            // rect.left    // 节点的左边界坐标
            // rect.right   // 节点的右边界坐标
            // rect.top     // 节点的上边界坐标
            // rect.bottom  // 节点的下边界坐标
            // rect.width   // 节点的宽度
            // rect.height  // 节点的高度
            if (rect.length > 0) {
                for (var i in rect) {
                    var item = rect[i];
                    if (item.height > 120) {
                        that.setData({
                            tagTop: item.top + (item.height / 2) - 35,
                            isHidden: true
                        })
                        break;
                    }
                }
            }
        }).exec()
    },
    showCompleteNews: function(){
        this.setData({ isHideNews: false });
    },
    collectTap: function () {
        var state = this.data.isCollect;
        var num = this.data.numCollect;
        this.switchTapEvent(state, num, 0);
    },
    likeTap: function () {
        var state = this.data.isLike;
        var num = this.data.numLike;
        this.switchTapEvent(state, num, 1);
    },
    wantTap: function () {
        var state = this.data.isWant;
        var num = this.data.numWant;
        this.switchTapEvent(state, num, 2);
    },
    switchTapEvent(state, num, key) {
        var url, param, cnt;
            state ? num-- : num++;
        switch (key) {
            case 0:
                url = '/UpdateNewsInfoCollection.aspx';
                cnt = state ? '已取消收藏' : '已收藏';
                param = {
                    NewID: this.newsId,
                    like: !state,
                    openID: this.openId
                };
                this.setData({
                    isCollect: !state,
                    numCollect: num
                });
                this.showToast(cnt);
                break;
            case 1:
                url = '/UpdateNewsInfoLike.aspx';
                cnt = state ? '已取消点赞' : '已点赞';
                param = {
                    NewID: this.newsId,
                    like: !state,
                    openID: this.openId
                };
                this.setData({
                    isLike: !state,
                    numLike: num
                });
                this.showToast(cnt);
                break;
            case 2:
                url = '/UpdateMovieAttitudeCount.aspx';
                param = {
                    movieID: this.data.movieId,
                    like: !state,
                };
                this.setData({
                    isWant: !state,
                    numWant: num
                });
                break;
        }
        model.post(url, param, function (result, msg) { })
    },
    showToast: function (cnt) {
        var that = this;
        clearTimeout(that.toastTimer);
        that.setData({
            isToast: true,
            toastCnt: cnt
        });
        that.toastTimer = setTimeout(function () {
            that.setData({
                isToast: false
            })
        }, 800)
    },
    scheduletap: function(e) {
        var movieId = e.currentTarget.dataset.movieid;
        wx.navigateTo({
            url: '../cinema/cinema?movieID=' + movieId + '&locationID=110100'
        })
    },
    newsDetailTap: function (e) {
        var newsId = e.currentTarget.dataset.newsid;
        wx.navigateTo({
            url: './news?newsId=' + newsId
        })
    },
    bindHomeBack: function(){
        wx.switchTab({
            url: '../article/article'
        })
    },
    previewImage: function (e) {
        var url = e.currentTarget.dataset.url;
        wx.previewImage({ urls: url });
    },
    onShareAppMessage: function() {
        var _mallId = wx.getStorageSync('mallId');
        return {
            title: this.data.newsInfo.title,
            path: 'pages/article/news?newsId=' + this.newsId + '&mallId=' + _mallId
        }
    },
    wrapText: function (ctx, text, x, y, maxWidth, lineHeight) {
        // 字符分隔为数组
        var arrText = text.split('');
        var line = '';

        for (var n = 0; n < arrText.length; n++) {
            var testLine = line + arrText[n];
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = arrText[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        };
        ctx.fillText(line, x, y);
    },
    shareToFriends: function () {
        this.queryPageCode();
        this.setData({ hiddenLoading: false });
    },
    closeCreate: function(){
        this.setData({ showCreate: false });
    },
    queryPageCode: function () {
        var that = this;
        var param = {
            sence: that.newsId,
            page: 'pages/news/news',
            size: '64'
        }
        that.code = 'https://miniprogramapi.moviefan.com.cn/GetWeixinMiniAppQRCode.aspx?channel='+ app.globalData.channel +'&sence=' + param.sence + '&page=' + param.page + '&size=' + param.size + '';
        that.createImg();
    },
    createImg: function () {
        var that = this;
        var userInfo = wx.getStorageSync('userInfoNew');
        var newsInfo = that.data.newsInfo;
        var phone = wx.getSystemInfoSync();
        var rpxWidth = phone.screenWidth;
        var rpxHeight = phone.screenHeight;
        var cw = (rpxWidth / 750) * 550;
        var ch = (rpxHeight / 1334) * 910;

        var imgSrc0 = newsInfo.images[0];
        var imgSrc1 = userInfo ? userInfo.avatarUrl : newsInfo.HeadImgUrl;
        var imgSrc2 = that.code ? that.code : 'https://www.moviefan.com.cn/images/code.jpg';
        var userName = userInfo ? userInfo.nickName : '好友';
        var title = newsInfo.title.length > 25 ? newsInfo.title.substring(0, 30) + '...' : newsInfo.title;
        var summary = newsInfo.summary.length > 50 ? newsInfo.summary.substring(0, 60) + '...' : newsInfo.summary;
        if(newsInfo.contentSummary){
            summary = newsInfo.contentSummary.length > 50 ? newsInfo.contentSummary.substring(0, 60) + '...' : newsInfo.contentSummary;
        }
        var wxGetImageInfo = promisify(wx.getImageInfo);
        Promise.all([
            wxGetImageInfo({
                src: imgSrc0
            }),
            wxGetImageInfo({
                src: imgSrc1
            }),
            wxGetImageInfo({
                src: imgSrc2
            })
        ]).then(res => {
            var w0 = res[0].width,
                h0 = res[0].height,
                posterWidth = cw - 20,
                posterHeight = (cw - 20) / 1.6;
            var ctx = wx.createCanvasContext('myCanvas');
            //底色
            ctx.setFillStyle('#ffffff');
            ctx.fillRect(0, 0, cw, ch);
            //海报图片
            ctx.drawImage(res[0].path, 0, 0, w0, w0 / 1.78, 10, 10, posterWidth, posterHeight);
            //头像
            ctx.save();
            ctx.beginPath();
            ctx.arc(30, posterHeight + 47, 20, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(res[1].path, 10, posterHeight + 27, 40, 40);
            ctx.restore();
            //用户名
            ctx.setFontSize(12);
            ctx.setFillStyle('#333333');
            ctx.fillText(userName, 60, posterHeight + 43);
            //向您推荐
            ctx.setFontSize(10);
            ctx.setFillStyle('#999999');
            ctx.fillText('向你推荐了这篇文章', 60, posterHeight + 59);
            //文章标题
            ctx.setFontSize(12);
            ctx.setFillStyle('#333333');
            that.wrapText(ctx, title, 18, posterHeight + 92, cw - 38, 18);
            //简介
            ctx.setFontSize(10);
            ctx.setFillStyle('#666666');
            that.wrapText(ctx, summary, 18, posterHeight + 140, cw - 38, 18);
            //二维码
            ctx.drawImage(res[2].path, cw / 2 - 20, posterHeight + 210, 40, 40);
            //二维码提示
            ctx.setFontSize(8);
            ctx.setFillStyle('#999999');
            ctx.fillText('长按扫码阅读', cw / 2 - 8 * 6 / 2, posterHeight + 278);
            ctx.draw();

            that.setData({
                showCreate: true,
                hiddenLoading: true
            });
        }).catch(function(err){
            console.log('err', err);
            that.setData({ hiddenLoading: true });
            wx.showModal({
                title: '提示',
                content: '生成图片失败，请重新生成',
                confirmText: '知道了',
                showCancel: false
            });
        });
    },
    saveImg: function () {
        var that = this;
        wx.canvasToTempFilePath({
            canvasId: 'myCanvas',
            success: function (res) {
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: function () {
                        wx.showModal({
							title: '成功保存图片',
							content: '已成功为您保存图片到手机相册，请自行前往朋友圈分享',
							confirmText: '知道了',
							showCancel: false,
							success: function (res) {
								if (res.confirm) {
									that.setData({ showCreate: false });
								}
							}
						})
                    }
                })
            }
        })
    }
})
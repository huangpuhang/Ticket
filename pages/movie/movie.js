'use strict';

var OrderPrompt = require('./_order-prompt');
var app = getApp();

var _app$require = app.require('scripts/movie'),
    movie = _app$require.movie,
    celebrity = _app$require.celebrity,
    comment = _app$require.comment,
    commentv2 = _app$require.commentv2,
    del_comment = _app$require.del_comment,
    format = _app$require.format,
    egg = _app$require.egg,
    get_bonus = _app$require.get_bonus;

var _require = require('./_comment'),
    formatComments = _require.formatComments;

var CREDITS_TYPE = {
  1: "演员",
  2: "导演",
  3: "副导演",
  4: "编剧",
  5: "制片人",
  6: "监制",
  7: "原创音乐",
  8: "摄影",
  9: "剪辑",
  10: "艺术指导",
  11: "美术设计",
  12: "服装设计",
  13: "化妆",
  14: "特效",
  15: "视觉效果",
  16: "武术指导",
  17: "翻译",
  18: "特别顾问"
};

var SCORE_TEXT = ['超烂啊', '超烂啊', '超烂啊', '比较差', '比较差', '一般般', '一般般', '比较好', '比较好', '棒极了', '完美'];

var red = require('./_red');

app.MoviePage({
  data: {
    screenHeight: '100%',
    collapse: true,
    theme: app.$theme,
    showRed: false,
    userId: 0
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;
    this.loading();

    console.log(options);
    if (options.utm_source) {
      app._forceMovieCinemaLocate = true;
    }

    if (options.utm_source === 'wechat_search' && options.cityId) {
      app.$location.city = {
        id: Number(options.cityId),
        nm: options.cityName
      };
    }

    var sys = app.system();
    this.setData({ screenHeight: sys.windowHeight + 100 + 'px' });

    this.modal = this.createModal('myModalDialog', {
      overlay: true
    });

    movie(options.movieId).then(format).then(function (movie) {
      // this.orderPrompt = new OrderPrompt({
      //   movieId: movie.id,
      // })

      movie.img = app.img(movie.img);
      movie.scoreText = movie.mysc + '\u5206\uFF0C' + SCORE_TEXT[movie.mysc];
      movie.snum = app.num(movie.snum);
      movie.proScoreNum = app.num(movie.proScoreNum);
      movie.wish = movie.wish + (movie.wishst ? 1 : 0);
      // http://wiki.sankuai.com/pages/viewpage.action?pageId=506307249#3.4专业评分的展示
      if (movie.globalReleased) {
        // 影片上映后
        if (movie.sc && movie.proScore) {
          movie.scoreStyle = 'movie-score-style8';
        } else if (movie.sc) {
          movie.scoreStyle = 'movie-score-style6';
        } else if (movie.proScore) {
          movie.scoreStyle = 'movie-score-style7';
        } else if (!(movie.proScore && movie.sc)) {
          movie.scoreStyle = 'movie-score-style5';
        }
      } else {
        // 影片上映前
        if (movie.proScore && movie.sc) {
          movie.scoreStyle = 'movie-score-style4';
        } else if (movie.sc) {
          movie.scoreStyle = 'movie-score-style2';
        } else if (movie.proScore) {
          movie.scoreStyle = 'movie-score-style3';
        } else if (!(movie.proScore && movie.sc)) {
          movie.scoreStyle = 'movie-score-style1';
        }
      }
      if (movie.egg) {
        egg(movie.id).then(function (egg) {
          return _this.setData({ egg: egg });
        });
      }
      _this.loading(false);
      return movie;
    }).then(function (movie) {
      return _this.setData({ movie: movie });
    }).then(function () {
      _this.getPhotos();
    }).catch(this.handleError.bind(this, 'page'));

    celebrity(options.movieId).then(function (celebrities) {
      var showType = -1;
      celebrities = [].concat.apply([], celebrities).filter(function (celebrity) {
        return !!~[1, 2].indexOf(celebrity.cr);
      }).map(function (celebrity) {
        celebrity.showType = celebrity.cr !== showType;
        showType = celebrity.cr;
        celebrity.type = CREDITS_TYPE[celebrity.cr];
        celebrity.avatar = app.img(celebrity.avatar, { e: 1 });
        celebrity.cnm = (celebrity.cnm || '').trim();
        celebrity.enm = (celebrity.enm || '').trim();
        celebrity.roles = (celebrity.roles || '').trim();
        return celebrity;
      });
      return celebrities;
    }).then(function (celebrities) {
      return _this.setData({ celebrities: celebrities });
    }).catch(this.handleError.bind(this));

    commentv2(options.movieId).then(function (body) {
      var icm = body.icm,
          hcmts = body.hcmts,
          cmts = body.cmts;

      if (icm) {
        icm.score *= 2;
        icm.scoreText = icm.score + '\u5206\uFF0C' + SCORE_TEXT[icm.score];
      }
      var comments = [];
      comments = comments.concat.apply(hcmts, cmts);
      comments = formatComments(comments.slice(0, 3));
      _this.setData({ comments: comments, icm: icm, comments_total: body.total });
      return comments;
    }).catch(this.handleError.bind(this));

    app.request().get('').query({ limit: 3 }).end().then(function (res) {
      var reviews = res.body.data;
      reviews = formatComments(reviews);
      _this.setData({ reviews: reviews, reviews_total: res.body.paging.total });
    }).catch(this.handleError.bind(this));

    app.request().get('').end().then(function (res) {
      return res.body;
    }).then(function (data) {
      var mbox = data.mbox,
          url = data.url,
          globalRelease = data.globalRelease;

      var mboxMap = {
        lastDayRank: '昨日票房排行',
        firstWeekBox: '首周票房(万)',
        sumBox: globalRelease ? '累计票房(万)' : '点映票房(万)',
        firstWeekOverSeaBox: '海外首周末票房(万美元)',
        sumOverSeaBox: '海外累计票房(万美元)'
      };
      var boxes = Object.keys(mboxMap).map(function (key) {
        return {
          text: mboxMap[key],
          rank: mbox[key]
        };
      });

      return mbox.sumBox + mbox.sumOverSeaBox > 0 ? mbox.sumBox ? boxes.slice(~~!mbox.lastDayRank, 3) : boxes.slice(3) : [];
    }).then(function (mbox) {
      return _this.setData({ mbox: mbox });
    }).catch(this.handleError.bind(this));

    var wxParamData = this.getWidgetParam('wxParamData', options);
    // jump to redenvelop
    if (options.activity_flag || wxParamData && wxParamData.activity_flag) {
      app.isLogin(function () {
        var user = app.$user || {};
        var token = user.token,
            userId = user.userId;


        get_bonus(token).then(function (res) {
          var hadDrawn = res && res.hadDrawn;
          if (!hadDrawn) {
            //没抢过,显示弹窗
            red.show.call(_this);
            _this.setData({
              userId: userId
            });
          }
        });
      }, function () {
        red.show.call(_this);
      });
    }
  },
  getWidgetParam: function getWidgetParam(paramName, data) {
    if (paramName === 'query') {
      if ('wxSearchQuery' in data) {
        return decodeURIComponent(data.wxSearchQuery);
      }
      return data.query;
    }
    if (!data[paramName]) {
      return;
    }
    if (paramName === 'widgetData' || paramName === 'wxParamData' || paramName === 'data') {
      if (this.isEncodeJson(data[paramName])) {
        return JSON.parse(decodeURIComponent(data[paramName]));
      } else {
        return JSON.parse(data[paramName]);
      }
    }
  },
  onShow: function onShow() {
    var _this2 = this;

    var movie = this.data.movie;
    if (movie) {
      commentv2(movie.id).then(function (body) {
        var icm = body.icm;

        icm.score *= 2;
        icm.scoreText = icm.score + '\u5206\uFF0C' + SCORE_TEXT[icm.score];
        _this2.setData({ icm: icm });
      });
    }

    // this.orderPrompt && this.orderPrompt.fetchData()
  },

  draw: function draw(e) {
    console.log('do draw');
    var user = app.$user || {};
    var token = user.token;

    if (token) {
      wx.navigateTo({
        url: '/pages/redenvelop/detail'
      });
    } else {
      app.checkLogin(function () {
        console.log('login success');
      }, function () {
        console.log('login fail');
      });
    }
  },
  closeMod: function closeMod(e) {
    red.hide.call(this);
  },
  onTapMovieImage: function onTapMovieImage() {
    var movie = this.data.movie;

    if (!movie.vd) {
      wx.previewImage({ urls: [movie.img] });
    }
  },
  onTapIntro: function onTapIntro(e) {
    this.setData({ collapse: !this.data.collapse });
  },
  onTapLike: function onTapLike(e) {
    var _this3 = this;

    app.checkLogin({
      warn: '添加想看前请先登录',
      success: function success() {
        if (_this3.data.icm) {
          _this3.dialog('是否取消看过？', '若取消看过，您的评分也将被删除', function (err, res) {
            if (!res.confirm) return;
            comment(_this3.data.movie.id).then(function (res) {
              return del_comment(res.id);
            }).then(function (res) {
              _this3.data.movie.mysc = 0;
              _this3.setData({ icm: false, movie: _this3.data.movie });
            });
          });
          return;
        }

        var BUSINESS_TYPE = {
          MAOYAN: 1,
          MEITUAN: 2
        };
        var data = {
          'userId': app.$user.id,
          'token': app.$user.token,
          'type': _this3.data.movie.wishst ^ 1,
          'business': BUSINESS_TYPE.MEITUAN,
          'clientType': 'touch'
        };
        var method = !!data.type ? 'post' : 'delete';
        app.request(method, '/hostproxy/mmdb/user/movie/' + _this3.data.movie.id + '/wish.json').query({
          clientType: 'wechat_small_program',
          channelId: app.channelId
        }).send(method == 'post' ? data : {}).header({
          token: app.$user.token
        }).end().then(function (res) {
          return res.body.data.id;
        }).then(function (id) {
          var movie = _this3.data.movie;

          if (id === movie.id) {
            movie.wishst = data.type;
            movie.wish = movie.wish + (movie.wishst ? 1 : -1);

            _this3.setData({ movie: movie });
            wx.hideToast();
            wx.showToast({
              title: '\u5DF2' + (data.type ? '标记' : '取消') + '\u60F3\u770B',
              icon: 'success',
              duration: 1000
            });
          } else {
            _this3.toast((data.type ? '标记' : '取消') + '\u60F3\u770B\u5931\u8D25', 1000);
          }
        });
      }
    });
  },
  onTapCelebrity: function onTapCelebrity(e) {
    var celebrity = e.currentTarget.dataset;
    this.setData({ celebrity: celebrity });
    this.modal.show();
  },
  onTapPhoto: function onTapPhoto(e) {
    wx.previewImage({
      current: this.data.photos[e.currentTarget.dataset.index],
      urls: this.data.photos
    });
  },
  getPhotos: function getPhotos() {
    var _this4 = this;

    return app.request().get('').query({}).end().then(function (res) {
      var photos = res.body.data.photos.map(function (e) {
        return app.img(e.olink);
      }).slice(0, _this4.data.movie.photos.length);
      _this4.data.movie.photos = photos.map(function (e) {
        return app.img(e, 220, 190);
      });
      _this4.setData({
        photos: photos,
        movie: _this4.data.movie
      });
    }).catch(this.handleError.bind(this));
  },
  onScroll: function onScroll(e) {
    var scrollTop = e.detail.scrollTop;
    app.title(scrollTop > 220 ? this.data.movie.nm : '影片详情');
  },
  onShareAppMessage: function onShareAppMessage() {
    var _data$movie = this.data.movie,
        nm = _data$movie.nm,
        sc = _data$movie.sc,
        proScore = _data$movie.proScore,
        wish = _data$movie.wish,
        pubDesc = _data$movie.pubDesc,
        globalReleased = _data$movie.globalReleased;


    var desc = [];

    var scDesc = sc ? '\u89C2\u4F17\u8BC4\u5206' + sc.toFixed(1) : '';
    var proScoreDesc = proScore ? '\u4E13\u4E1A\u8BC4\u5206' + proScore.toFixed(1) : '';

    if (globalReleased && (scDesc || proScoreDesc)) {
      desc = [scDesc, proScoreDesc];
    } else {
      var wishDesc = wish ? wish + '\u4EBA\u60F3\u770B' : '';
      desc = [wishDesc, pubDesc];
    }

    return {
      title: '\u300A' + nm + '\u300B' + desc.filter(function (item) {
        return !!item;
      }).join('，'),
      path: '/pages/movie/movie?movieId=' + this.options.movieId + '&' + app.shareParams()
    };
  }
});
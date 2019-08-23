'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _movie = require('./templates/movie.compile');

var _movie2 = _interopRequireDefault(_movie);

var _cinema = require('./templates/cinema.compile');

var _cinema2 = _interopRequireDefault(_cinema);

var _ticket = require('./templates/ticket.compile');

var _ticket2 = _interopRequireDefault(_ticket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WidgetDom = require('./WidgetDom/index.js');


var queryType = void 0;
var maxActorsNum = 12; // 主演字段最多可以显示的中文字符个数。英文及符号按照中文字宽度的一半来算
var fontSize = 14; // 主演字段的字符尺寸

Widget({
  onLoad: function onLoad(options) {
    console.log(options);
    // debugger;

    var ctx = this.getContext();
    var width = options.width,
        height = options.height,
        query = options.query;

    var widgetData = this.getWidgetParam('widgetData', query);
    var wxParamData = this.getWidgetParam('wxParamData', query);

    queryType = widgetData.data_type;

    var classObj = require('./styles/' + queryType);

    var _updateWidgetData = this.updateWidgetData(widgetData),
        tpl = _updateWidgetData.tpl,
        renderData = _updateWidgetData.renderData;

    var data = {
      query: query.query,
      data: renderData,
      errCode: widgetData.err_code,
      errMsg: widgetData.err_msg
    };

    if (queryType == 'ticket') {
      var activity = wxParamData.activity_flag;
      data.onTapMovie = function (index) {
        var moviePage = '/pages/movie/movie?movieId=' + renderData.hotList[index].movie_id + '&from=search&activity_flag=' + (activity || '');
        wx.openApp({
          url: moviePage
        });
      };
      data.onTapCount = function () {
        var homePage = '/pages/movie/index?from=search&activity_flag=' + (activity || '');
        wx.openApp({
          url: homePage
        });
      };
    }

    // 初始绘制
    WidgetDom.init({
      windowWidth: width,
      windowHeight: height,
      render: tpl,
      data: data,
      classObj: classObj,
      ctx: ctx
      /* debugMode: 'boundary'*/
      /* imageDebug: 'images/cinema.png',*/
    });

    if (queryType == 'ticket') {
      WidgetDom.useDynamicHeight();
    }

    if (data) {
      WidgetDom.setData(data);
    }
  },
  onTap: function onTap(options) {
    var ret = WidgetDom.handleTap(options);
    if (queryType == 'ticket') {
      return true;
    } else {
      return ret;
    }
  },
  onDataPush: function onDataPush(options) {
    console.log(options);
    if (options.data) {
      var widgetData = this.getWidgetParam('data', options);

      var _updateWidgetData2 = this.updateWidgetData(widgetData),
          tpl = _updateWidgetData2.tpl,
          renderData = _updateWidgetData2.renderData;

      var data = {
        data: renderData,
        errCode: widgetData.err_code,
        errMsg: widgetData.err_msg
      };
      WidgetDom.setData(data);
    }
  },
  updateWidgetData: function updateWidgetData(widgetData) {
    var data = {},
        tpl = void 0;
    switch (queryType) {
      case 'movie':
        tpl = _movie2.default;
        data = this.format(widgetData['movie_data']);
        break;
      case 'cinema':
        tpl = _cinema2.default;
        data = this.format(widgetData['cinema_data']);
        break;
      case 'ticket':
        tpl = _ticket2.default;
        data.hotList = this.formatHotList(widgetData['wx_widget_list_movie']);
        data.remain_count = widgetData['remain_count'];
        break;
      default:
        tpl = _movie2.default;
    }
    data.renderData = data;
    data.tpl = tpl;
    return data;
  },
  isEncodeJson: function isEncodeJson(str) {
    return typeof str === 'string' && str.trim()[0] === '%';
  },


  // 由于版本历史原因，onLoad的widgetData，wxParamData，query参数请通过此方法获取，示例：getWidgetParam('widgetData', options.query);
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
  format: function format(data) {
    if (queryType === 'movie') {
      return this.formatMovie(data);
    }
    return this.formatCinema(data);
  },
  formatMovie: function formatMovie(movie) {
    if (!movie.movie_actors) {
      movie.movie_actors = [];
    }
    var actorsLen = movie.movie_actors.length;
    if (actorsLen > 0) {
      var actors = movie.movie_actors.join('|');
      var adjustmaxActorsNum = maxActorsNum;
      if (queryType == 'ticket') {
        adjustmaxActorsNum = 16;
      }
      actors = this.formatOverflowText(actors, adjustmaxActorsNum * fontSize);
      movie.movie_actors = actors.split('|');
      if (movie.movie_actors[movie.movie_actors.length - 1] === '...') {
        movie.movie_actors.splice(-1);
      }
    }

    movie.movie_price = movie.movie_price ? (+movie.movie_price).toFixed(1) : '';
    movie.img = this.img(movie.movie_img, 220, 304);
    movie.version = this.version(movie.movie_dimensional);
    movie.hasReleased = movie.movie_release_time ? Date.parse(movie.movie_release_time) <= Date.now() : false;
    return movie;
  },
  formatCinema: function formatCinema(cinema) {
    cinema.img = this.img(cinema.cinema_img, 110, 110);

    return cinema;
  },
  img: function img(src, options, h) {
    if (!src) return src;
    src = src.replace('/w.h/', '/');
    src = src.split('@')[0];

    if (typeof options === 'undefined') {
      options = {};
    }
    if (typeof options === 'number') {
      options = { w: options, h: h };
    }

    // 指定尺寸小于原图会裁剪，大于原图会返回原图，
    options = _extends({
      l: 1,
      e: 1,
      c: 1
    }, options);

    if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
      src += '@';
      src += Object.keys(options).map(function (k) {
        return options[k] + k;
      }).join('_');
    }
    return src;
  },
  version: function version(v) {
    var _v = ['2D', '3D', 'IMAX 2D', 'IMAX 3D'];
    var versions = (v || '').split('/') // step1: "2D/3D/IMAX 3D/中国巨幕" -> [ "2D", "3D", "IMAX 3D", "中国巨幕" ]
    .filter(function (v) {
      return !!~_v.indexOf(v);
    }) // step2: -> [ "2D", "3D", "IMAX 3D" ]
    // step3: -> ["IMAX 3D", "3D", "2D"]
    .sort(function (b, a) {
      return _v.indexOf(a) - _v.indexOf(b);
    }).map(function (v) {
      return v
      // step4: rename `IMAX 2D` and `IMAX 3D` to `2DIMAX` and `3DIMAX`,
      .replace(/IMAX (\d)D/, function (_, n) {
        return n + 'DIMAX';
      });
    });
    return versions[0] || '';
  },


  // 计算文本长度
  measureText: function measureText(text) {
    var system = wx.getSystemInfoSync();
    var isDevTool = system.platform === 'devtools';
    // 匹配双字节字符正则（包括中文汉字）
    var cReg = /[^\x00-\xff]/g;
    // 英文大写字母
    var uReg = /[A-Z]/g;
    // 大写字母个数
    var uLength = text.length - text.replace(uReg, '').length;
    // 中文字符个数
    var hLength = text.length - text.replace(cReg, '').length;
    return fontSize * hLength + fontSize * (isDevTool ? 0.5 : 0.75) * uLength + (text.length - uLength - hLength) * fontSize * 0.5;
  },


  // 文本是否超长
  exceedWidth: function exceedWidth(content, width) {
    return this.measureText(content) > width;
  },
  formatOverflowText: function formatOverflowText(text, maxWidth) {
    var textStr = '';
    for (var i = 0; i < text.length; i++) {
      textStr += text[i];
      if (this.exceedWidth(textStr, maxWidth)) {
        return textStr.slice(0, textStr.length - 3) + '...';
      }
    }
    return textStr;
  },


  // format ticket data:hotList
  formatHotList: function formatHotList(hotList) {
    var _this = this;

    return hotList.map(function (movie) {
      var format_movie = {};

      console.log(movie);
      format_movie.movie_img = movie.img_url;
      format_movie.movie_name = movie.wx_widget_name;
      format_movie.movie_dimensional = movie.movie_dimensional;
      format_movie.movie_score = movie.score;
      format_movie.movie_expect = movie.movie_wish;
      format_movie.movie_actors = movie.actor_list;
      format_movie.movie_id = movie.movie_id;
      format_movie.movie_price = movie.price || '';

      format_movie = _this.formatMovie(format_movie);
      format_movie.hasReleased = movie.is_release;
      format_movie.movie_price = parseInt(format_movie.movie_price);
      return format_movie;
    });
  }
});
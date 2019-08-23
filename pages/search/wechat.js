'use strict';

var app = getApp();

app.MoviePage({
  onLoad: function onLoad(options) {
    var _this = this;

    var widgetData = options.widgetData ? this.getWidgetParam('widgetData', options) : null;
    var wxParamData = this.getWidgetParam('wxParamData', options);
    var type = widgetData ? widgetData.data_type : '';

    // 不发请求，直接用参数跳转
    if (widgetData) {
      var data = widgetData[type + '_data'];
      var activity_flag = wxParamData.activity_flag || '';
      return this.jump(type, data, activity_flag);
    }

    var city = '北京';
    var movieName = '';
    var cinemaName = '';

    wxParamData.slot_list.forEach(function (_ref) {
      var key = _ref.key,
          value = _ref.value;

      if (key === 'city') {
        city = value;
      }
      if (key === 'movie_name') {
        movieName = value;
      }
      if (key === 'cinema_name') {
        cinemaName = value;
      }
    });

    this.loading();
    app.request().get('/wxapp/search').query({
      city: city,
      movie_name: movieName,
      cinema_name: cinemaName
    }).end().then(function (res) {
      var dataType = res.body.data_type;
      var data = res.body[dataType + '_data'];
      _this.jump(dataType, data);
    });
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
  jump: function jump(type, data, activity_flag) {
    var _data$movie_id = data.movie_id,
        movieid = _data$movie_id === undefined ? '' : _data$movie_id,
        _data$cinema_id = data.cinema_id,
        cinemaid = _data$cinema_id === undefined ? '' : _data$cinema_id,
        _data$movie_city = data.movie_city,
        cityname = _data$movie_city === undefined ? '' : _data$movie_city,
        _data$movie_city_id = data.movie_city_id,
        cityid = _data$movie_city_id === undefined ? '' : _data$movie_city_id;


    if (type === 'movie' && movieid) {
      wx.redirectTo({
        url: '/pages/movie/movie?movieId=' + movieid + '&cityId=' + cityid + '&cityName=' + cityname + '&activity_flag=' + activity_flag + '&utm_source=wechat_search'
      });
    } else if (type === 'cinema' && cinemaid) {
      wx.redirectTo({
        url: '/pages/cinema/cinema?cinemaId=' + cinemaid + '&movieId=' + movieid + '&activity_flag=' + activity_flag + '&utm_source=wechat_search'
      });
    }
  }
});
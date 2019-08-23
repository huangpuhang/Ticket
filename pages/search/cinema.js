'use strict';

var app = getApp();

var _app$require = app.require('scripts/movie'),
    populars = _app$require.populars,
    version = _app$require.version,
    get_bonus = _app$require.get_bonus;

var _require = require('../cinema/_cinema-item'),
    formatCinemas = _require.formatCinemas;

var formatMovies = function formatMovies(movies) {
  return movies.map(function (movie) {
    movie.page = 'wish';
    movie.score = movie.sc.toFixed(1);
    if (movie.ver) {
      movie.movie3d = movie.ver.match(/3D/i);
      movie.movieImax = movie.ver.match(/imax/i);
    }
    if (movie.img) {
      movie.img = app.img(movie.img, 128, 180);
    }
    return movie;
  });
};

var metaMap = {
  '-1': {
    placeholder: '搜影院',
    noWord: '没有找到相关内容'

  },
  0: {
    searchUrl: '/wxapi/mmdb/search/movie/keyword/list.json',
    format: formatMovies
  },
  2: {
    placeholder: '找影院',
    noWord: '没有找到相关影院',
    searchUrl: '/wxapi/mmdb/search/cinema/keyword/list.json',
    format: formatCinemas
  }
};

app.MoviePage({
  data: {
    type: -1,
    keyword: '',
    focus: false,
    history: [],
    hotMovies: [],
    results: [],
    hasResults: false,
    showSuggestion: true, // 是否显示搜索历史和热搜电影
    correctionV2: '', // 纠错字
    correctionType: -1, // 纠错类型
    metaMap: metaMap
  },
  onLoad: function onLoad(options) {
    var _this = this;

    this.options = options;
    var keyword = options.keyword ? options.keyword : '';
    options.type = options.type ? +options.type : -1;
    this.setData({
      keyword: keyword,
      hasResults: !!keyword,
      type: options.type,
      placeholder: metaMap[options.type].placeholder
    });

    if (keyword.length) {
      this.loading();
      return this.integratedSearch(0)(keyword);
    }

    this.searchHistoryKey += '[' + options.type + ']';
    if (options.type === -1) {
      // this.getHotMovie()
    }
    this.showSuggestion();
    setTimeout(function () {
      _this.setData({ focus: true });
    }, 1000);
  },

  /**
   * 取消搜索，回到上一个页面
   */
  cancel: function cancel() {
    if (this.options.from === 'widget') {
      return wx.switchTab({ url: '/pages/movie/index' });
    }
    app.goto(-1);
  },
  showSuggestion: function showSuggestion() {
    this.getSearchHistory();
    this.setData({
      showSuggestion: true,
      results: []
    });
  },
  getKeyword: function getKeyword(e) {
    var keyword = e.detail.value.trim();
    if (!this.search) {
      this.search = this.integratedSearch(400);
    }
    this.search(keyword);
    if (keyword.length === 0) {
      this.showSuggestion();
    }
  },
  integratedSearch: function integratedSearch(delay) {
    var _this2 = this;

    var iscorrected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var timer = void 0;
    var randomKey = void 0;
    return function (keyword) {
      var randomKeyLocal = randomKey = Math.random();
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        if (keyword) {
          app.request().get('/search/all').query({
            keyword: keyword
          }).end().then(function (res) {
            return res.body;
          }).then(function (data) {
            if (randomKeyLocal === randomKey) {
              var hasResults = false;
              var lastType = void 0;

              var _data = data.data;
              if (data.code == 0 && data.data) {

                if (_data.cinemaEntities.length > 0) {
                  hasResults = true;
                }
              }
              var setData = function setData() {
                _this2.setData({
                  keyword: keyword,
                  // results: data.data,
                  movieEntities: _this2.groupMoviesByDate(_data.movieEntities),
                  cinemaEntities: _data.cinemaEntities,
                  hasResults: hasResults,
                  // lastType,
                  showSuggestion: false
                  // correctionV2: data.correctionV2,
                  // correctionType: data.correctionType,
                });
              };
              // if (!hasResults) {
              _this2.loading(false);
              return setData();
              // }
              // this.fetch(lastType, 0, data.correctionType === 2 ? data.correctionV2 : keyword)
              //   .then(list => {
              //     data.data.forEach(meta => {
              //       if (meta.type === lastType) {
              //         meta.list = metaMap[lastType].format(list)
              //       }
              //     })
              //     this.loading(false)
              //     setData();
              //   })
            }
          }).catch(function (err) {
            _this2.loading(false);
            _this2.handleError(err);
          });
        }
      }, delay);
    };
  },
  groupMoviesByDate: function groupMoviesByDate(movies, isRefresh) {
    // let coming = isRefresh ? [] : this.data.coming;
    // let index = coming.length - 1;

    movies.map(function (movie) {
      movie.moviePosterMini = movie.movieVerticalImage;
      movie.actor = movie.actors;
      movie.version = version(movie.movieVersions);
      movie.name = movie.movieNameCn;
      movie.tags = movie.movieTypes;
      // movie.img = app.img(movie.img, 128, 180);
      movie.showInfo = '';
      movie.showTimeInfo = '';
      movie.score = parseFloat(movie.score).toFixed(1);
    });

    return movies;
  },
  fetch: function fetch(type, offset, keyword) {
    return app.request().get('/hostproxy/mmdb/search/integrated/keyword/list.json').config('key', 'search').query({
      keyword: keyword,
      offset: offset,
      stype: type,
      iscorrected: true,
      ci: app.$location.city ? app.$location.city.id : 1,
      lng: app.$location.longitude,
      lat: app.$location.latitude
    }).end().then(function (res) {
      return res.body;
    }).then(function (body) {
      return body.data[0] || {};
    }).then(function (data) {
      return data.list || [];
    });
  },
  onReachBottom: function onReachBottom() {
    var _this3 = this;

    var _data2 = this.data,
        keyword = _data2.keyword,
        lastType = _data2.lastType,
        results = _data2.results,
        correctionType = _data2.correctionType,
        correctionV2 = _data2.correctionV2;

    if (!keyword || lastType === undefined) return;
    var result = void 0;
    for (var i = 0; i < results.length; i++) {
      result = results[i];
      if (result.type === lastType) break;
    }
    if (result.total === result.list.length) return;

    this.fetch(lastType, result.list.length, correctionType === 2 ? correctionV2 : keyword).then(function (list) {
      result.list = result.list.concat(metaMap[lastType].format(list));
      _this3.setData({ results: results });
    });
  },
  getHotMovie: function getHotMovie() {
    var _this4 = this;

    app.request().get('/hostproxy/mmdb/search/movie/hotmovie/list.json').end().then(function (res) {
      return res.body.data;
    }).then(function (data) {
      _this4.setData({
        hotMovies: data
      });
    });
  },
  onInputBlur: function onInputBlur(e) {
    var _data3 = this.data,
        keyword = _data3.keyword,
        hasResults = _data3.hasResults;

    if (keyword && hasResults) {
      this.setSearchHistory(keyword);
    }
  },

  searchHistoryKey: 'searchHistory',
  setSearchHistory: function setSearchHistory(keyword) {
    var local = app.get(this.searchHistoryKey);
    !local && (local = []);
    var i = local.indexOf(keyword);
    i !== -1 && local.splice(i, 1);
    local.unshift(keyword);
    local.length === 3 && local.pop(); // 最多三个搜索历史
    app.set(this.searchHistoryKey, local);
  },
  getSearchHistory: function getSearchHistory() {
    var history = app.get(this.searchHistoryKey);
    if (history) {
      this.setData({ history: history });
    }
  },
  delSearchHistory: function delSearchHistory(e) {
    var index = e.currentTarget.dataset.index;

    this.data.history.splice(index, 1);
    var history = this.data.history;
    this.setData({ history: history });
    app.set(this.searchHistoryKey, history);
  },

  /**
   * 点击搜索历史进行搜索
   */
  tapToSearch: function tapToSearch(e) {
    this.setData({ focus: false });
    var _e$currentTarget$data = e.currentTarget.dataset,
        keyword = _e$currentTarget$data.keyword,
        iscorrected = _e$currentTarget$data.iscorrected;

    this.setSearchHistory(keyword);
    this.integratedSearch(0, iscorrected === 'true')(keyword);
  }
});
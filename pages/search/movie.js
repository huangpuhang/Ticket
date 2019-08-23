'use strict';

var app = getApp();

var _app$require = app.require('scripts/movie'),
    search = _app$require.search;

app.MoviePage({
  data: {
    movies: [],
    offset: 0,
    hasMore: true
  },
  onLoad: function onLoad(options) {
    this.setData(options);
    this.onReachBottom();
  },
  onReachBottom: function onReachBottom() {
    var _this = this;

    if (!this.data.hasMore) return;
    search(this.data.query, this.data.offset).then(function (movies) {
      var hasMore = movies.length;
      movies = _this.data.movies.concat(movies);
      _this.setData({ movies: movies, offset: movies.length, hasMore: hasMore });
    }).catch(this.handleError.bind(this));
  }
});
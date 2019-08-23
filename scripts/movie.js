'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.format = format;
exports.version = version;
exports.populars = populars;
exports.movie = movie;
exports.celebrity = celebrity;
exports.egg = egg;
exports.search = search;
exports.comment = comment;
exports.commentv2 = commentv2;
exports.del_comment = del_comment;
exports.get_bonus = get_bonus;
var app = getApp();

/**
 * [movie description]
 * @return {[type]} [description]
 */
function format(movie) {
  // movie.stars = app.star(movie.sc / 2);
  // movie.img = app.img(movie.img, 128, 180);
  // movie.buy =  ~[3, 4].indexOf(movie.showst);
  movie.sc = movie.score;
  movie.score = parseFloat(movie.sc).toFixed(1);
  // movie.proScoreText = parseFloat(movie.proScore).toFixed(1);
  // movie.version = version(movie.version);
  // if(movie.photos){
  //   movie.photos = movie.photos.map(p => app.img(p, 220, 190));
  // }
  return movie;
}

function version(v) {
  var _v = ['3D', 'IMAX 2D', 'IMAX 3D'];
  var versions = (v || '').split('/') // step1: "2D/3D/IMAX 3D/中国巨幕" -> [ "2D", "3D", "IMAX 3D", "中国巨幕" ]
  .filter(function (v) {
    return !!~_v.indexOf(v);
  }) // step2: -> [ "2D", "3D", "IMAX 3D" ]
  // step3: -> ["IMAX 3D", "3D", "2D"]
  .sort(function (b, a) {
    return _v.indexOf(a) - _v.indexOf(b);
  }).map(function (v) {
    return v
    // step4: rename `IMAX 2D` and `IMAX 3D` to `2D IMAX` and `3D IMAX`,
    .replace(/IMAX (\d)D/, function (_, n) {
      return n + 'D IMAX';
    })
    // add `v` to 2d, 3d -> ["v3d imax", "3d", "2d"]
    // because css class can not start with number
    .replace(/(\d)D/, function (_, n) {
      return 'v' + n + 'd';
    }).toLowerCase();
  });
  return versions[0] || ''; // step5: -> "v3d imax"
}

/**
 * [populars description]
 * @param  {[type]} offset [description]
 * @param  {[type]} limit  [description]
 * @return {[type]}        [description]
 */
function populars(offset, limit) {
  limit = limit || 12;
  offset = offset || 0;
  return app.request().get('/movie/list').header({'mallcoo-mall-id': wx.getStorageSync('mallId')}).config('key', 'movies').query({
    cityno: app.$location.city ? app.$location.city.id : 110100
  }).end().then(function (res) {
    var data = res.body.data;
    data = data.map(format);
    return {
      data: data,
      displayComingSoon: res.body.displayComingSoon
    };
  });
}

function movie(movieId) {
  return app.request()
  // .config({ loading: true })
  .get('/hostproxy/mmdb/movie/v5/' + movieId + '.json').query({
    ci: app.$location.city ? app.$location.city.id : 1
  }).end().then(function (res) {
    return res.body.data.movie;
  }).then(format);
}

function celebrity(movieId) {
  return app.request().get('/hostproxy/mmdb/v7/movie/' + movieId + '/celebrities.json').end().then(function (res) {
    return res.body.data;
  });
}

function egg(movieId) {
  return app.request().get('/hostproxy/mmdb/movie/egg/' + movieId + '.json').end().then(function (res) {
    return res.body.data.endEgg;
  });
}

/**
 * [search description]
 * @param  {[type]} keyword [description]
 * @return {[type]}         [description]
 */
function search(keyword, offset) {
  offset = offset || 0;
  return app.request().get('/hostproxy/mmdb/search/movie/keyword/list.json').query({
    keyword: keyword,
    offset: offset
  }).end().then(function (res) {
    return res.body.list;
  }).then(function (movies) {
    return movies.map(function (movie) {
      return format(movie);
    });
  });
}

function comment(movieId, score, content) {
  return app.request().post('/hostproxy/mmdb/comments/movie/' + movieId + '.json').query({
    clientType: 'wechat_small_program',
    channelId: app.channelId
  }).send({
    nick: app.$user.nickName,
    userId: app.$user.userId,
    token: app.$user.token,
    uuid: app.$uuid,
    score: score,
    content: content
  }).end().then(function (res) {
    return res.body.data;
  });
}

function commentv2(movieId, offset, limit) {
  limit = limit || 3;
  offset = offset || 0;
  return app.request().get('/hostproxy/mmdb/comments/movie/v2/' + movieId + '.json').query({
    limit: limit,
    offset: offset,
    uuid: app.$uuid,
    token: app.$user.token,
    userid: app.$user.userId,
    ci: app.$location.city ? app.$location.city.id : undefined,
    clientType: 'wechat_small_program',
    channelId: app.channelId
  }).header({
    token: app.$user.token

  }).end().then(function (res) {
    return res.body;
  });
}

function del_comment(id) {
  return app.request().delete('/hostproxy/mmdb/comment/' + id + '.json').query({
    token: app.$user.token,
    userId: app.$user.userId,
    clientType: 'wechat_small_program',
    channelId: app.channelId
  }).end().then(function (res) {
    return res.body.data;
  });
}

function get_bonus(token) {
  return app.request('post', '/hostproxy/market/wxsmall/bonus/query.json').header({
    'token': token,
    shareId: 13996
  }).end().then(function (res) {
    return res.body.data;
  });
}
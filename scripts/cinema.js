'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.search = search;
exports.format = format;
var app = getApp();
var _ = app.require('scripts/movie');
/**
 * [search description]
 * @param  {[type]} keyword [description]
 * @return {[type]}         [description]
 */
function search(keyword, offset) {
  offset = offset || 0;
  return app.request().get('/hostproxy/mmdb/search/cinema/keyword/list.json').query({
    offset: offset,
    keyword: keyword,
    ctid: app.$location.city.id,
    lng: app.$location.longitude,
    lat: app.$location.latitude
  }).end().then(function (res) {
    return res.body.data;
  }).then(function (cinemas) {
    return cinemas.map(format);
  });
}
/**
 * [format description]
 * @param  {[type]} cinema [description]
 * @return {[type]}        [description]
 */
function format(cinema) {
  var location = app.$location;
  cinema.showPrice = +cinema.sellPrice; // 是否显示价格
  if (!location.locationCity || location.city.id !== location.locationCity.id) {
    delete cinema.distance;
  } else if (parseFloat(cinema.distance) < 1) {
    cinema.distance = parseFloat(cinema.distance) * 1000 + 'm';
  } else {
    cinema.distance = parseFloat(cinema.distance) + 'km';
  }

  if (cinema.tag && cinema.tag.vipTag === '满赠卡') {
    cinema.tag.vipTag = '';
  }
  if (cinema.tag && cinema.tag.vipTag === '会员卡') {
    cinema.tag.vipTag = '折扣卡';
  }
  return cinema;
}
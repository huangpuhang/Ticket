'use strict';

var app = getApp();

module.exports = {
  formatCinemas: function formatCinemas(cinemas) {
    var location = app.$location;
    return cinemas.map(function (cinema) {
      cinema.showPrice = +cinema.sellPrice; // 是否显示价格

      var distance = parseFloat(cinema.distance);
      // if (!location.locationCity
      //   || location.city.id !== location.locationCity.id
      //   || isNaN(distance)) {
      //   cinema.resolvedDistance = '';
      // } else if (distance < 1) {
      //   cinema.resolvedDistance = (distance * 1000) + 'm';
      // } else {
      //   cinema.resolvedDistance = distance + 'km';
      // }

      if (cinema.tag && cinema.tag.vipTag === '满赠卡') {
        cinema.tag.vipTag = '';
      }
      if (cinema.tag && cinema.tag.vipTag === '会员卡') {
        cinema.tag.vipTag = '折扣卡';
      }
      return cinema;
    });
  }
};
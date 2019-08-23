'use strict';

var event = require('../scripts/event');
var store = require('../scripts/store');
var request = require('../scripts/request');

var cityModel = {
  data: {},
  set: function set(data) {
    this.data = data;
    this.emit('change', this.data);
  },
  fetch: function fetch(fresh) {
    var _this = this;

    if (this.data.nameMap && !fresh) {
      return this.data;
    }

    return request()
    // .get('/hostproxy/dianying/cities.json')
    .get('/city/list').end().then(function (res) {
      var app = getApp();
      // let citys = res.body.cts
      var citys = res.body.data.normal;

      // if (!app.$debug) {
      //   citys = citys.filter(item => item.id !== 8000)
      // }

      var nameMap = {};
      var idMap = {};
      var letterMap = {};
      for (var charCode = 65; charCode <= 90; charCode++) {
        letterMap[String.fromCharCode(charCode)] = [];
      }
      for (var i = 0, l = citys.length; i < l; i++) {
        var city = citys[i];
        city.id = city.cityId;
        city.nm = city.cityName;
        city.py = city.cityPinyin;

        nameMap[city.nm] = city;
        idMap[city.id] = city;
        letterMap[city.py[0].toUpperCase()].push(city);
      }

      Object.keys(letterMap).forEach(function (key) {
        if (!letterMap[key].length) {
          delete letterMap[key];
        }
      });

      citys = {
        nameMap: nameMap,
        idMap: idMap,
        letterMap: letterMap
      };

      _this.set(citys);

      return citys;
    });
  }
};

event.attach(cityModel);

module.exports = cityModel;
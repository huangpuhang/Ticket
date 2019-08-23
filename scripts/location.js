'use strict';

var historyCityListKey = 'historyCityList';
var hotCityList = ['北京市', '上海市', '深圳市', '武汉市'];

function toPromise(fn) {
  var _this = this;

  return new Promise(function (resolve, reject) {
    fn.call(_this, function (err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}

function wxToPromise(fn) {
  var _this2 = this;

  return new Promise(function (resolve, reject) {
    fn.call(_this2, {
      success: function success(data) {
        resolve(data);
      },
      fail: function fail(err) {
        reject(err);
      },
      complete: function complete(res) {
        if (res.errMsg === 'getLocation:cancel') {
          reject(Error(res.errMsg));
        }
      }
    });
  });
}

var locationUtil = {
  /**
   * 获取经纬度
   * @return
   *   {
   *     latitude,
   *     longitude
   *   }
   */
  getLocation: function getLocation(fresh) {
    var app = getApp();
    if (new Date() - (this.lastLocationTime || 0) < 5000) {
      return this.locationPromise;
    }

    if (app.$location.latitude && !fresh) {
      return Promise.resolve(app.$location);
    }

    var currentPage = app.page();
    if (currentPage.locationDisabled) {
      return Promise.reject(Error('locate forbidden'));
    }

    // if (app.get('location-auth-deny')) {
    //   return Promise.reject(Error('getLocation:fail auth deny'))
    // }

    this.lastLocationTime = +new Date();
    this.locationPromise = wxToPromise(wx.getLocation).then(function (location) {
      app.$location.latitude = location.latitude;
      app.$location.longitude = location.longitude;
      app.$location.speed = location.speed;
      app.$location.accuracy = location.accuracy;
      return app.$location;
    }).catch(function (e) {
      delete app.$location.latitude;
      delete app.$location.longitude;
      delete app.$location.speed;
      delete app.$location.accuracy;
      delete app.$location.locationCity;

      console.log('location e', e);
      if (e.errMsg === 'getLocation:fail auth deny') {
        app.set('location-auth-deny', 1, 12 * 60 * 60);
      }

      throw e;
    });
    return this.locationPromise;
  },

  /**
   * 获取城市信息
   * @return
   *   {
   *     id: 1,
   *     city: "北京",
   *     detail: "东辛店路",
   *     district: "朝阳区",
   *     lat: 40.012196,
   *     lng: 116.49471,
   *     province: "北京市",
   *     status: 1
   *   }
   */
  getCity: function getCity() {
    var app = getApp();
    var location = app.$location;
    return Promise.all([this.getCitysFromCache(), app.request().get('/hostproxy/locate/v2/rgeo?coord=' + [location.latitude, location.longitude, 1].join(',')).header('content-type', 'application/json').header('x-host', 'http://apimobile.vip.sankuai.com').end().then(function (res) {
      return res.body.data;
    })]).then(function (rets) {
      var nameMap = rets[0].nameMap;
      var cityname = rets[1].city;
      var cityInfo = nameMap[cityname];
      if (!cityInfo) {
        throw new Error('定位城市不在服务范围中：' + cityname);
      }
      var city = {
        id: cityInfo.id,
        nm: cityname
      };

      app.$location.locationCity = city;

      return city;
    });
  },
  getCitys: function getCitys() {
    var app = getApp();
    return app.request().get('/city/list')
    // .get('/city/list')
    .end().then(function (res) {
      var citys = res.body.data,
          normal = void 0,
          hot = void 0;
      if (citys) {
        normal = citys.normal;
        hot = citys.hot;
      }

      if (citys.length < 500) {
        throw new Error('cities length less than 500');
      }

      if (!app.$debug) {
        citys = citys.filter(function (item) {
          return item.id !== 8000;
        });
      }

      var nameMap = {};
      var idMap = {};
      var letterMap = {};
      var len = normal.length;
      for (var charCode = 65; charCode <= 90; charCode++) {
        letterMap[String.fromCharCode(charCode)] = [];
      }
      for (var i = 0, l = len; i < l; i++) {
        var city = normal[i];
        city.nm = city.cityName;
        city.id = city.cityId;
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

      return {
        nameMap: nameMap,
        idMap: idMap,
        letterMap: letterMap
      };
    });
  },

  getCitysFromCache: function () {
    var requestPromise = void 0;
    return function () {
      var app = getApp();

      if (requestPromise) {
        return requestPromise;
      }

      var citys = app.get('citys');
      if (citys && Object.keys(citys.nameMap).length > 500) {
        return Promise.resolve(citys);
      }

      requestPromise = this.getCitys().then(function (data) {
        requestPromise = null;
        app.set('citys', data, { expires: 10 * 60 });
        return data;
      }).catch(function (err) {
        requestPromise = null;
        throw err;
      });
      return requestPromise;
    };
  }(),
  getHotCitys: function getHotCitys() {
    return this.getCitysFromCache().then(function (citys) {
      var nameMap = citys.nameMap;
      return hotCityList.map(function (name) {
        return nameMap[name];
      });
    });
  },
  addCitys: function addCitys(cityInfo) {
    var app = getApp();
    if (!cityInfo.id) {
      return;
    }
    cityInfo.id = Number(cityInfo.id);

    var historyCityList = app.get(historyCityListKey) || [];
    historyCityList = historyCityList.filter(function (city) {
      return city.id !== cityInfo.id;
    });
    historyCityList.unshift(cityInfo);
    historyCityList = historyCityList.slice(0, 2);
    app.set(historyCityListKey, historyCityList);
    return historyCityList;
  }
};

module.exports = locationUtil;
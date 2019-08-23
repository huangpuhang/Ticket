'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var event = require('../scripts/event');
var promisify = require('../scripts/promisify');
var request = require('../scripts/request');
var store = require('../scripts/store');

var locationModel = require('./location');
var citysModel = require('./citys');

var cityModel = {
  data: {},
  set: function set(data) {
    this.data = data;
    this.emit('change', this.data);
  },
  fetch: function fetch(fresh) {
    var _this = this;

    var citysPromise = void 0;
    var citysStore = store.get('citys');
    if (citysStore) {
      citysPromise = Promise.resolve(citysStore);
    } else {
      citysPromise = citysModel.fetch();
    }

    var cityPromise = locationModel.fetch(fresh).then(function (location) {
      return request().get('/city/currentCity?longitude=' + location.longitude + '&latitude=' + location.latitude).header('content-type', 'application/json').end().then(function (res) {
        return res.body.data;
      });
    });

    return Promise.all([cityPromise, citysPromise]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          cityRes = _ref2[0],
          citysRes = _ref2[1];

      var nameMap = citysRes.nameMap;
      var cityname = cityRes.mallCityName;
      var cityInfo = nameMap[cityname];
      if (!cityInfo) {
        throw new Error('定位城市不在服务范围中：' + cityname);
      }
      var city = {
        id: cityInfo.id,
        nm: cityname
      };

      var mall = {
        "mallId": cityRes.mallId,
        "name": cityRes.mallName,
      }
      wx.setStorageSync('mallDialogInfo', mall);
      _this.set(city);

      return city;
    }).catch(function (err) {
      _this.emit('error', err);
      throw err;
    });
  }
};

event.attach(cityModel);

module.exports = cityModel;
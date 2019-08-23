'use strict';

var META_DATA = '_';

module.exports = {
  /**
   * [get description]
   * @param  {[type]} key [description]
   * @return {[type]}     [description]
   */
  get: function get(key) {
    var _this = this;

    if (key) {
      var value = wx.getStorageSync(key);
      if (value.expires) {
        if (value.timestamp + value.expires * 1000 < new Date()) {
          this.remove(key);
          return '';
        }
        value = value.value;
      }
      return value;
    }
    var storage = wx.getStorageSync(META_DATA) || {};
    return (storage.keys || []).reduce(function (ret, item) {
      ret[item] = _this.get(item);
      return ret;
    }, {});
  },

  /**
   * [set description]
   * @param {[type]} key   [description]
   * @param {[type]} value [description]
   */
  set: function set(key, value, opts) {
    var expires = opts && opts.expires;
    var meta = wx.getStorageSync(META_DATA) || {};
    meta.keys = meta.keys || [];
    if (key === null) {
      wx.clearStorage();
      meta.keys = [];
    } else if (key) {
      if (meta.keys.indexOf(key) === -1) {
        meta.keys.push(key);
      }
      if (expires) {
        value = {
          value: value,
          expires: expires,
          timestamp: +new Date()
        };
      }
      wx.setStorageSync(key, value);
    } else {
      console.error('storage', 'invalid key ' + key);
      return this;
    }
    meta.timestamp = +new Date();
    wx.setStorageSync(META_DATA, meta);
    return this;
  },
  update: function update(key, value) {
    var valueObj = wx.getStorageSync(key);

    if (valueObj.expires) {
      valueObj.value = value;
    } else {
      valueObj = value;
    }
    wx.setStorageSync(key, valueObj);

    return this;
  },
  remove: function remove(key) {
    var meta = wx.getStorageSync(META_DATA);
    meta = meta || {};
    meta.keys = meta.keys || [];

    var index = meta.keys.indexOf(key);
    if (index !== -1) {
      meta.keys.splice(index, 1);
    }
    wx.setStorageSync(META_DATA, meta);

    wx.removeStorageSync && wx.removeStorageSync(key);
  },

  /**
   * [storage description]
   * @param  {[type]} key   [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  storage: function storage(key, value) {
    if (arguments.length === 2) {
      return this.set(key, value);
    }
    return this.get(key);
  },

  /**
   * Storage
   */
  config: function config(key, value) {
    var config = this.get('config');
    if (arguments.length == 2) {
      config[key] = value;
      return this;
    }
    return config[key];
  },

  /**
   * 清除过期的存储
   */
  clearOutdate: function clearOutdate() {
    var _this2 = this;

    wx.getStorageInfo({
      success: function success(res) {
        var keys = res.keys;

        if (Array.isArray(keys)) {
          keys.forEach(function (key) {
            _this2.get(key);
          });
        }
      }
    });
  }
};
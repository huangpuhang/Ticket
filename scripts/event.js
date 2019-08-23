"use strict";

module.exports = {
  on: function on(name, callback) {
    var list = this._events[name] || [];
    list.push(callback);
    this._events[name] = list;
    return this;
  },
  off: function off(name, callback) {
    if (!name && !callback) {
      this._events = {};
      return this;
    }

    if (!callback) {
      delete this._events[name];
      return this;
    }

    var list = this._events[name];
    if (list) {
      this._events[name] = list.filter(function (item) {
        return item !== callback;
      });
    }

    return this;
  },
  emit: function emit(name, data) {
    var list = this._events[name] || [];

    list.forEach(function (item) {
      item(data);
    });
  },
  attach: function attach(obj) {
    obj._events = {};
    obj.on = this.on;
    obj.off = this.off;
    obj.emit = this.emit;
  }
};
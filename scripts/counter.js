'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * 定时器
 * init param
 *   page 当前页面对象
 *   key 唯一id
 *   total 总时间
 *   tick 每秒执行的函数
 *   end 结束时执行的函数
 * clear 清除定时器
 */
var app = getApp();

module.exports = {
  init: function init(config) {
    var _this = this;

    this.timers = {};

    this.config = _extends({
      page: app.page(),
      key: 'default',
      total: 60,
      tick: function tick() {},
      end: function end() {}
    }, config);

    var _config = this.config,
        page = _config.page,
        key = _config.key,
        total = _config.total,
        tick = _config.tick,
        end = _config.end;


    this.total = total;
    tick.call(page, total);

    this.timers[key] = setInterval(function () {
      _this.total = total -= 1;

      if (total > 0) {
        tick.call(page, total);
      }

      if (total === 0) {
        end.call(page);
        _this.clear(key);
      }
    }, 1000);

    return this;
  },
  clear: function clear(key) {
    var _this2 = this;

    if (key) {
      clearInterval(this.timers[key]);
      return this;
    }

    Object.keys(this.timers).forEach(function (item) {
      clearInterval(_this2.timers[item]);
    });
  }
};
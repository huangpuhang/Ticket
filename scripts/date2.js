'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * [Date2 description]
 * @param {[type]} options [description]
 */
function Date2(options) {
  if (!(this instanceof Date2)) return new Date2(options);

  if (options instanceof Date) this.date = options;

  switch (typeof options === 'undefined' ? 'undefined' : _typeof(options)) {
    case 'number':
      this.date = new Date(options);
      break;
    case 'string':
      this.date = this.parse(options);
      break;
    case 'object':
      this.date = this.create(options);
      break;
    default:
      this.date = new Date(options || null);
      break;
  }
};

Date2.prototype.parse = function (str, options) {
  var obj = {},
      map = {
    fullYear: 1,
    year: 2,
    month: 3,
    date: 4,
    time: 5,
    hour: 6,
    minute: 7,
    second: 8
  };
  var matchs = /((\d{4})-(\d{2})-(\d{2}))?\s?((\d{2}):(\d{2}):(\d{2}))?/.exec(str);
  for (var key in map) {
    if (matchs[map[key]]) {
      obj[key] = matchs[map[key]];
    }
  }
  return this.create(obj);
};

Date2.prototype.create = function (options) {
  var year = +options.year,
      month = +options.month - 1,
      date = +options.date,
      hour = +options.hour,
      minute = +options.minute,
      second = +options.second;

  var _date = new Date(0);
  year && _date.setYear(year);
  month && _date.setMonth(month);
  date && _date.setDate(date);
  hour && _date.setHours(hour);
  minute && _date.setMinutes(minute);
  second && _date.setSeconds(second);
  // console.log(_date);
  return _date;
};

/**
 * [toString description]
 * @return {[type]} [description]
 */
Date2.prototype.toString = function (format) {
  var _this = this;

  if (format === undefined) return this.date.toString();
  var self = this,
      obj = {
    "M+": this.date.getMonth() + 1,
    "d+": this.date.getDate(),
    "h+": this.date.getHours() % 12 === 0 ? 12 : this.date.getHours() % 12,
    "H+": this.date.getHours(),
    "m+": this.date.getMinutes(),
    "s+": this.date.getSeconds(),
    "q+": Math.floor((this.date.getMonth() + 3) / 3),
    "S": this.date.getMilliseconds(),
    "E": function () {
      var ONE_DAY = 1000 * 60 * 60 * 24;
      var now = new Date();
      var day = self.date.getDay();
      var diff = Math.floor((new Date(+self.date).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / ONE_DAY);
      var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return ['今天'][diff] || (day === 0 || day === 6) && weekDays[day] || ['', '明天', '后天'][diff] || weekDays[day] || '';
    }(),
    "T": function () {
      var now = new Date();
      var diff = now - self.date.getTime();
      if (diff < 1000 * 60) {
        return '刚刚';
      } else if (diff < 1000 * 60 * 60) {
        return Math.floor(diff / (1000 * 60)) + '分钟前';
      } else if (diff < 1000 * 60 * 60 * 24) {
        return Math.floor(diff / (1000 * 60 * 60)) + '小时前';
      } else if (diff < 1000 * 60 * 60 * 24 * 7) {
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + '天前';
      } else {
        var month = _this.date.getMonth() + 1;
        var day = _this.date.getDate();
        var date = (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
        if (_this.date.getFullYear() === now.getFullYear()) {
          return date;
        } else {
          return _this.date.getFullYear() + '-' + date;
        }
      }
    }()
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (this.date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in obj) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? obj[k] : ("00" + obj[k]).substr(("" + obj[k]).length));
    }
  }
  return format;
};

module.exports = Date2;
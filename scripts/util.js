'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getFormatDate = getFormatDate;
/* String */
String.format = function () {
    var args = arguments;
    if (args.length == 0) return "";
    if (args.length == 1) return arguments[0];

    var regex = /{(\d+)?}/g,
        arg,
        result;
    if (args[1] instanceof Array) {
        arg = args[1];
        result = args[0].replace(regex, function ($0, $1) {
            return arg[parseInt($1)];
        });
    } else {
        arg = args;
        result = args[0].replace(regex, function ($0, $1) {
            return arg[parseInt($1) + 1];
        });
    }
    return result;
};

function formatTime(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}

function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}

function showModal(title, content, callback) {
    wx.showModal({
        title: title,
        content: content,
        success: function success(res) {
            if (res.confirm) {
                callback && callback();
            }
        }
    });
}

function getHundredMillion(num, _units) {
    if (!_units) {
        if (num >= 10000) {
            return getFormattedNum((num / 10000).toFixed(1)) + '万';
        } else {
            return num <= 0 ? 0 : getFormattedNum(num);
        }
    } else {
        return num <= 0 ? 0 : getFormattedNum(num);
    }
}

function getFormattedNum(num) {
    // make sure it is String
    return String(num).replace(/\B(?=(?:\d{3})+\b)/g, ',');
}

//考虑到iOS的兼容性，对日期格式做特殊处理
var monthAbbr = {
    '1': 'Jan',
    '2': 'Feb',
    '3': 'Mar',
    '4': 'Apr',
    '5': 'May',
    '6': 'Jun',
    '7': 'Jul',
    '8': 'Aug',
    '9': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec'
};

//日期转转换成星期
var weekAbbr = {
    "0": "周日",
    "1": "周一",
    "2": "周二",
    "3": "周三",
    "4": "周四",
    "5": "周五",
    "6": "周六"

    //形成最终页面展示日期
};var formateDate = function formateDate(date) {
    var displayDate;
    var prefix = getRelativeDate(date); //得到今天、明天、后天、''的一个

    var displayapidate = displayApiDate(date);
    var fullDate = displayapidate.fullDate;
    var monthDay = displayapidate.monthDay;
    var week = displayapidate.week;

    //如果前缀为'',那么展示年份，否则，展示对应的相对日期（今天、明天、后天）
    if (prefix) {
        displayDate = prefix + ' ' + monthDay + '';
    } else {
        if (week) displayDate = week + " " + monthDay + ' ';else displayDate = fullDate + ' ';
    }
    return displayDate;
};

var scheduleDates = function scheduleDates(sche) {
    if (!sche) return null;

    var result = [];
    var dates = Object.keys(sche);

    for (var index = 0; index < dates.length; index++) {
        var date = dates[index];
        var value = formateDate(date);
        result.push({ date: date, dateText: value, day: date });
    }
    return result;
};

//根据时间差，得到相对时间，判断是否为今天、明天、后天
var getRelativeDate = function getRelativeDate(date) {

    var relativeDate;

    var apiTime = timeCompareKey(strpTime(date)).substring(0, 11);
    var currentTime = timeCompareKey(getCurrentTime()).substring(0, 11);

    var timedifference = timeDifference(apiTime, currentTime);

    var oneDay = 24 * 60 * 60 * 1000;
    var twoDays = 2 * oneDay;

    switch (timedifference) {
        case 0:
            relativeDate = '今天';
            break;
        case oneDay:
            relativeDate = '明天';
            break;
        case twoDays:
            relativeDate = '后天';
            break;
        default:
            relativeDate = '';
    }
    return relativeDate;
};

//将日期格式转化为iOS系统可识别的格式，比如'Apr 23 2015 00:00'或者'Apr 23 2015 23:20'
var timeCompareKey = function timeCompareKey(time) {
    if (!time.hourMinute) {
        time.hourMinute = '00:00';
    }
    return [time.monthAbbr, time.day, time.year, time.hourMinute].join(' ');
};
//根据字符串('20510513')获取年月日
var strpTime = function strpTime(date) {
    var dateString = date ? date.toString() : '';
    var month = parseInt(dateString.substring(4, 6));
    return {
        year: dateString.substring(0, 4),
        month: month,
        monthAbbr: monthAbbr[month],
        day: parseInt(dateString.substring(6))
    };
};

//转化为同一格式之后，开始比较当前时间与后端返回时间的时间差
var timeDifference = function timeDifference(apiTime, currentTime) {
    return Date.parse(apiTime) - Date.parse(currentTime);
};

//获取当前时间
var getCurrentTime = function getCurrentTime() {
    var now = new Date();
    var hourminute = hourMinute(now.getHours(), now.getMinutes());

    return {
        year: now.getFullYear(),
        monthAbbr: monthAbbr[parseInt(now.getMonth() + 1)],
        day: parseInt(now.getDate()),
        hourMinute: hourminute
    };
};

//处理小时和分钟的格式，转化为类似'23:02'的格式
var hourMinute = function hourMinute(hour, minute) {
    hour = parseInt(hour);
    minute = parseInt(minute);
    hour = hour < 10 ? '0' + hour : hour;
    minute = minute < 10 ? '0' + minute : minute;
    return hour + ':' + minute;
};

//将后端数据('20150423')转化为'年月日'的格式，比如'2015年4月23日'
var displayApiDate = function displayApiDate(date) {
    var strptime = strpTime(date);

    var year = strptime.year + '-'; //2015年

    var endDate = new Date();
    endDate.setDate(endDate.getDate() + 6);

    var weekDate = new Date(strptime.year + "/" + strptime.month + "/" + strptime.day);
    var week = weekDate <= endDate ? weekAbbr[weekDate.getDay()] : "";

    var month = strptime.month + '-' + strptime.day;
    var monthDay = week != "" ? ' ' + month + ' ' : month; //(4月23日)

    return {
        fullDate: year + monthDay,
        year: year,
        monthDay: monthDay,
        week: week
    };
};

// 判断两个日期是同一天
function isEqualDays(day1, day2) {
    var _day1 = new Date(day1);
    var _day2 = new Date(day2);
    var _y1 = _day1.getFullYear(),
        _m1 = _day1.getMonth(),
        _d1 = _day1.getDate(),
        _y2 = _day2.getFullYear(),
        _m2 = _day2.getMonth(),
        _d2 = _day2.getDate();
    if (_y1 == _y2 && _m1 == _m2 && _d1 == _d2) {
        return true;
    } else {
        return false;
    }
}

//正则匹配手机号
function checkPhone(value) {
    var myreg = /^1(3|4|5|7|8)\d{9}$/;
    if (myreg.test(value)) return true;
    return false;
}

//格式化日期字符串 yyyy-mm-dd
function _formatDate(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    var d = date.getDate();
    d = d < 10 ? '0' + d : d;
    return y + '-' + m + '-' + d;
}
//判断是否为数字
function checkNumber(value) {
    var reg = new RegExp("^[0-9]*$");
    if (!reg.test(value)) return false;
    return true;
}

//比较两个日期 yyyy-MM-dd
function compareDate(a, b) {
    if (a == b) return false;

    var arr = a.split("-");
    var starttime = new Date(arr[0], arr[1], arr[2]);
    var starttimes = starttime.getTime();

    var arrs = b.split("-");
    var lktime = new Date(arrs[0], arrs[1], arrs[2]);
    var lktimes = lktime.getTime();

    if (starttimes > lktimes) {
        //a 早于 b 返回false
        return false;
    } else {
        return true;
    }
}

//返回北京时区时间
var DateJing8 = function DateJing8(_date) {
    var date = new Date(_date);
    return new Date(new Date(_date) * 1 + 8 * 3600 * 1000 + date.getTimezoneOffset() * 60 * 1000);
};

/*
 * @param {String} _dateStr
 * @return {String}  X 月 X 日
 */
var getChineseDateStr = function getChineseDateStr(_dateStr) {
    var _date = DateJing8(_dateStr);
    // var _m = _date.getMonth() + 1, //  好坑，从0开始
    //     _m = _m < 10 ? "0" + _m : _m,
    //     _d = _date.getDate(),
    //     _d = _d < 10 ? "0" + _d : _d,
    //     _s = _m + "-" + _d;
    var _str = _date.getMonth() + 1 + "月" + _date.getDate() + "日";

    return _str;
};

var getDay = function getDay(_dateStr) {
    var _date = DateJing8(_dateStr),
        _day = _date.getDay(),
        _dayMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    return _dayMap[_day];
};

function getFormatDate1(_dateStr) {
    var dateStr = parseInt(_dateStr);
    var date = getChineseDateStr(dateStr);
    var day = getDay(dateStr);
    var time = getTimeStr(dateStr);
    // console.log('getFormatDate  =======>', date + ' ' + time)
    return date + day + ' ' + time;
}

/**
 * @param {Date}
 * @return {String} 格式化字符串
 */
var getDateStr = function getDateStr(_dateStr) {
    var _date = DateJing8(_dateStr);
    var _y = _date.getFullYear(),
        _m = _date.getMonth() + 1,
        //  好坑，从0开始
    _m = _m < 10 ? "0" + _m : _m,
        _d = _date.getDate(),
        _d = _d < 10 ? "0" + _d : _d,
        _s = _y + "-" + _m + "-" + _d;
    return _s;
};

var getTimeStr = function getTimeStr(_dateStr) {
    var _date = DateJing8(_dateStr);
    var _h = _date.getHours(),
        _h = _h < 10 ? "0" + _h : _h,
        _m = _date.getMinutes(),
        _m = _m < 10 ? "0" + _m : _m,
        _s = _date.getSeconds(),
        _s = _s < 10 ? "0" + _s : _s;
    return _h + ":" + _m;
};

function getFormatDate(_dateStr) {
    var dateStr = parseInt(_dateStr);
    var date = getDateStr(dateStr);
    var time = getTimeStr(dateStr);
    // console.log('getFormatDate  =======>', date + ' ' + time)
    return date + ' ' + time;
}

module.exports = {
    formatTime: formatTime,
    showModal: showModal,
    String: String,
    getHundredMillion: getHundredMillion,
    scheduleDates: scheduleDates,
    formateDate: formateDate,
    getRelativeDate: getRelativeDate,
    isEqualDays: isEqualDays,
    checkPhone: checkPhone,
    _formatDate: _formatDate,
    checkNumber: checkNumber,
    compareDate: compareDate,
    getFormatDate: getFormatDate,
    getFormatDate1: getFormatDate1
};
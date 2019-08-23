/**
 * Created by vincentyan on 2016/9/28.
 * Edited by Fa1r. on 2018/09/07
 */
import { md5 } from './md5';

// var base = "http://182.92.5.211:10086";
// var base = "https://ceshimobileapi.moviefan.com.cn";
var base = "https://miniprogramapi.moviefan.com.cn";
var token = '16';
var _channel = 'xcx_dypyplus';
module.exports = {
    isOk: function (res) {
        return res.errMsg == "request:ok";
    },
    getMsg: function (res) {
        return {statusCode: res.statusCode, errMsg: res.errMsg};
    },
    navToError: function (data) {
        wx.redirectTo({
            url: '../error/error?msg=' + encodeURIComponent(data.errorInfo),
        });
    },
    shallowClone: function (source) {
        if (!source || typeof source !== 'object') {
            throw new Error('error arguments');
        }
        var targetObj = source.constructor === Array ? [] : {};
        for (var keys in source) {
            if (source.hasOwnProperty(keys)) {
                targetObj[keys.toLocaleLowerCase()] = source[keys];
            }
        }
        return targetObj;
    },
    getQueryStringToObj: function (url) {
        var json = {};
        var arr = url.substr(url.indexOf('?') + 1).split('&');
        arr.forEach(item => {
            var tmp = item.split('=');
            json[tmp[0]] = tmp[1];
        });
        return json;
    },
    formatSign: function (param) {
        var _param = this.shallowClone(param),
            _keys = Object.keys(_param),
            _keysSort = _keys.sort(),
            str = '';

        for (var i in _keysSort) {
            var item = _keysSort[i];
            str += item + '=' + decodeURIComponent(_param[item]) + '&';
        }
        str = str.slice(0, -1) + 'QKZeN1wF9lDIVuQQe7vF4ioqJ33kdVE2';
        str = md5(str).toLocaleLowerCase();
        return str;
    },
    post: function (url, data, success, fail, complete) {
        var app = getApp(),
            that = this,
            url = base + url,
            method = "POST",
            time = new Date().getTime(),
            sign = '',
            tempObj = {};
        if(url.indexOf('?') >= 0){
            url = url + '&channel=' + _channel
        }else {
            url = url + '?channel=' + _channel
        }
        tempObj = Object.assign({}, data, that.getQueryStringToObj(url));
        data.sign = that.formatSign(tempObj);
        var param = {
            url: url,
            method: method,
            data: data,
            header: {
                'content-type': 'application/x-www-form-urlencoded',
                'Token': md5(token + time),
                'Timestamp': time
            },
            success: function (res) {
                if (that.isOk(res)) {
                    var data = res.data;
                    var msg = that.getMsg(res);
                    if (data.ErrorCode == -299) {
                        console.log('-299', param);
                        wx.hideLoading();
                        wx.showModal({
                            content: '错误代码：-299',
                            showCancel: false
                        })
                        return;
                    }
                    if (success)success(data, msg);
                }
                else {
                    console.log("request:error");
                }
            },
            fail: function (res) {
                console.log("request:fail");
            },
            complete: function (res) {
                console.log("request:complete");
            }
        }
        wx.request(param);
    }
}
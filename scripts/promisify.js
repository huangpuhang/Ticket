"use strict";

module.exports = {
  wx2promise: function wx2promise(fn, params) {
    params = params || {};
    return new Promise(function (accept, reject) {
      params.success = accept;
      params.fail = reject;
      fn(params);
    });
  }
};
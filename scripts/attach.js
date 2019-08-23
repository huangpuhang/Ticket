"use strict";

module.exports = function (target, source) {
  Object.keys(source).forEach(function (key) {
    if (target[key]) {
      throw Error("key\uFF1A" + key + "\u91CD\u590D");
    }
    target[key] = source[key];
  });
};
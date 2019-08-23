"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.banner = banner;
var app = getApp();

function banner(type) {
  return app.request().get("/advertisement/list").query({
    advertisementTypeId: type
  }).end().then(function (res) {
    var data = res.body.data;

    return data;
  });
}
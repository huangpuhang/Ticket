'use strict';

var Date2 = require('../../scripts/date2.js');
var app = getApp();
var defaultHeadImg = 'http://p1.meituan.net/movie/657a4f30793555753aeb1fdda660d3c62409.png';

module.exports = {
  formatComments: function formatComments(cmts) {
    return cmts.map(function (cmt) {
      cmt.avatarurl = (cmt.avatarurl.split('@')[0] || defaultHeadImg) + '@60w_60h';
      cmt.tm = new Date2(cmt.startTime).toString('T');
      if (cmt.tagList && cmt.tagList.fixed) {
        cmt.tagDy = !!cmt.tagList.fixed.filter(function (e) {
          return e.name === '点映';
        }).length;
        cmt.tagBuy = !!cmt.tagList.fixed.filter(function (e) {
          return e.name === '购票';
        }).length;
      }

      if (cmt.pro && app.get('pro-comment-' + cmt.id + '-approved')) {
        cmt.approved = true;
      }

      cmt.scoreArray = app.star(cmt.score);
      cmt.score *= 2;
      return cmt;
    });
  }
};
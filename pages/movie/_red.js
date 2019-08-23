'use strict';

function show(fixed) {
  console.log(fixed);
  var self = this;
  self.setData({
    showRed: true,
    disableScroll: fixed
  });
}

function hide() {
  var self = this;
  self.setData({
    showRed: false,
    disableScroll: ''
  });
}

exports.show = show;
exports.hide = hide;
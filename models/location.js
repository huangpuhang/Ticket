'use strict';

var event = require('../scripts/event');
var promisify = require('../scripts/promisify');

var location = {
  data: {},
  set: function set(data) {
    this.data = data;
    this.emit('change', this.data);
  },
  fetch: function fetch(fresh) {
    var _this = this;

    if (new Date() - (this.lastLocationTime || 0) < 5000) {
      return this.locationPromise;
    }

    if (this.data.latitude && !fresh) {
      return Promise.resolve(this.data);
    }

    this.lastLocationTime = +new Date();
    this.locationPromise = promisify.wx2promise(wx.getLocation).then(function (res) {
      _this.set(res);
      return res;
    });

    return this.locationPromise;
  }
};

event.attach(location);

module.exports = location;
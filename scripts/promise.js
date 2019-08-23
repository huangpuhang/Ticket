"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

!function (e) {
  function t() {}function n(e, t) {
    return function () {
      e.apply(t, arguments);
    };
  }function o(e) {
    if ("object" != _typeof(this)) throw new TypeError("Promises must be constructed via new");if ("function" != typeof e) throw new TypeError("not a function");this._state = 0, this._handled = !1, this._value = void 0, this._deferreds = [], a(e, this);
  }function i(e, t) {
    for (; 3 === e._state;) {
      e = e._value;
    }if (0 === e._state) return void e._deferreds.push(t);e._handled = !0, o._immediateFn(function () {
      var n = 1 === e._state ? t.onFulfilled : t.onRejected;if (null === n) return void (1 === e._state ? r : u)(t.promise, e._value);var o;try {
        o = n(e._value);
      } catch (e) {
        return void u(t.promise, e);
      }r(t.promise, o);
    });
  }function r(e, t) {
    try {
      if (t === e) throw new TypeError("A promise cannot be resolved with itself.");if (t && ("object" == (typeof t === "undefined" ? "undefined" : _typeof(t)) || "function" == typeof t)) {
        var i = t.then;if (t instanceof o) return e._state = 3, e._value = t, void f(e);if ("function" == typeof i) return void a(n(i, t), e);
      }e._state = 1, e._value = t, f(e);
    } catch (t) {
      u(e, t);
    }
  }function u(e, t) {
    e._state = 2, e._value = t, f(e);
  }function f(e) {
    2 === e._state && 0 === e._deferreds.length && o._immediateFn(function () {
      e._handled || o._unhandledRejectionFn(e._value);
    });for (var t = 0, n = e._deferreds.length; t < n; t++) {
      i(e, e._deferreds[t]);
    }e._deferreds = null;
  }function c(e, t, n) {
    this.onFulfilled = "function" == typeof e ? e : null, this.onRejected = "function" == typeof t ? t : null, this.promise = n;
  }function a(e, t) {
    var n = !1;try {
      e(function (e) {
        n || (n = !0, r(t, e));
      }, function (e) {
        n || (n = !0, u(t, e));
      });
    } catch (e) {
      if (n) return;n = !0, u(t, e);
    }
  }var s = setTimeout;o.prototype.catch = function (e) {
    return this.then(null, e);
  }, o.prototype.then = function (e, n) {
    var o = new this.constructor(t);return i(this, new c(e, n, o)), o;
  }, o.all = function (e) {
    var t = Array.prototype.slice.call(e);return new o(function (e, n) {
      function o(r, u) {
        try {
          if (u && ("object" == (typeof u === "undefined" ? "undefined" : _typeof(u)) || "function" == typeof u)) {
            var f = u.then;if ("function" == typeof f) return void f.call(u, function (e) {
              o(r, e);
            }, n);
          }t[r] = u, 0 == --i && e(t);
        } catch (e) {
          n(e);
        }
      }if (0 === t.length) return e([]);for (var i = t.length, r = 0; r < t.length; r++) {
        o(r, t[r]);
      }
    });
  }, o.resolve = function (e) {
    return e && "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && e.constructor === o ? e : new o(function (t) {
      t(e);
    });
  }, o.reject = function (e) {
    return new o(function (t, n) {
      n(e);
    });
  }, o.race = function (e) {
    return new o(function (t, n) {
      for (var o = 0, i = e.length; o < i; o++) {
        e[o].then(t, n);
      }
    });
  }, o._immediateFn = "function" == typeof setImmediate && function (e) {
    setImmediate(e);
  } || function (e) {
    s(e, 0);
  }, o._unhandledRejectionFn = function (e) {
    "undefined" != typeof console && console;
  }, o._setImmediateFn = function (e) {
    o._immediateFn = e;
  }, o._setUnhandledRejectionFn = function (e) {
    o._unhandledRejectionFn = e;
  }, "undefined" != typeof module && module.exports ? module.exports = o : e.Promise || (e.Promise = o);
}(undefined);
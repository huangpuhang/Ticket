'use strict';

/* global Page wx __wxRoute*/
/* eslint
  func-names: off,
  no-param-reassign: off,
  no-trailing-spaces: off,
  vars-on-top: off,
  camelcase: off,
  no-restricted-syntax: [error, WithStatement],
  no-plusplus: off,
  no-prototype-builtins: off,
  new-cap: warn,
  no-new-func: warn,
  no-bitwise: warn,
  no-var: off,
  space-before-function-paren: off,
  space-before-blocks: off,
  no-use-before-define: off,
  object-shorthand: off,
  no-mixed-operators: off,
  keyword-spacing: off,
  prefer-arrow-callback: off,
  prefer-rest-params: off,
  no-useless-concat: off
*/
(function (undefined) {
  // eslint-disable-line
  var env;
  var MSID_EXPIRES = 6 * 60 * 60 * 1000; // msid 过期时间：6小时
  var exports = module.exports = function (opts) {
    wx.removeStorageSync('stats_utm');
    if (!env) {
      var info = wx.getSystemInfoSync();
      /* {
        "model": "iPhone 6",
        "pixelRatio": 3,
        "windowWidth": 414,
        "windowHeight": 696,
        "system": "iOS 10.0.1",
        "language": "zh_CN",
        "version": "6.3.9",
        "platform": "devtools"
      } */
      var m = /(\w+)\s*([\d+\.]+)?/.exec(info.system);
      env = {
        sdk_ver: 'wx_stats_2.0',
        ch: 'weixin',
        ct: m && m[1].toLowerCase(),
        os: m && m[2],
        lch: info.platform,
        ua: 'MicroMessengerWXA ' + '(' + info.model + '; ' + info.system + '; ' + info.pixelRatio + 'dpr; language/' + info.language + ') ' + info.platform + '/' + info.version + ' NetType/',
        sc: info.windowHeight + '*' + info.windowWidth
      };
      wx.getNetworkType({
        success: function success(res) {
          env.ua.replace(/(NetType\/).*/, '$1' + res.networkType.toUpperCase());
        }
      });
    }
    return function (props) {
      inject(opts, props);
    };
  };

  var ignoreProps = {
    stats: 1,
    data: 1,
    onLoad: 1,
    onReady: 1,
    onShow: 1,
    onHide: 1,
    onPullDownRefresh: 1,
    onUnload: 1
  };
  function inject(opts, props) {
    var val = {};
    // 页面基本信息
    var ev = {
      val_cid: props.val_cid || (__wxRoute !== undefined ? __wxRoute : ''),
      val_val: function val_val() {
        return assign({}, val, props.val_val);
      }
    };
    // mge/order/pay 手动埋点
    props.stats = function (nm, val_bid, val_lab) {
      // eslint-disable-line
      if (nm !== 'order' && nm !== 'pay') {
        val_lab = val_bid;
        val_bid = nm;
        nm = 'mge';
      }
      stats(opts, assign({
        nm: nm,
        val_bid: val_bid,
        val_lab: val_lab
      }, ev));
    };

    // utm
    wrapProp(props, 'onLoad', function (key, prop, args) {
      if (JSON.stringify(args[0] || {}) !== '{}') {
        var utm = {
          utm_source: args[0].utm_source,
          utm_medium: args[0].utm_medium,
          utm_term: args[0].utm_term,
          utm_content: args[0].utm_content,
          utm_campaign: args[0].utm_campaign
        };
        if (JSON.stringify(utm) !== '{}') {
          storage('stats_utm', utm);
        }
        val.custom = assign({}, val.custom, args[0]);
      }

      prop.apply(this, args);
    });

    var tmShow;
    // mpt
    wrapProp(props, 'onShow', function (key, prop, args) {
      tmShow = +new Date();
      ev.req_id = tmShow * 1000 + (Math.random() * 1000 | 0);
      setTimeout(function () {
        stats(opts, assign({
          nm: 'mpt',
          val_act: 'pageview'
        }, ev));
      }, 100);
      prop.apply(this, args);
    });
    // report
    wrapProp(props, 'onHide', function (key, prop, args) {
      setTimeout(function () {
        stats(opts, assign({
          isauto: 1,
          nm: 'report',
          val_act: 'quit',
          val_bid: 'pagehide',
          val_lab: {
            duration: new Date() - tmShow
          }
        }, ev));
      }, 100);
      prop.apply(this, args);
    });

    // 自动埋点
    var filter = function filter(key) {
      var ret = !ignoreProps[key] && typeof props[key] === 'function';
      if (opts.injectFilter) {
        ret = ret && opts.injectFilter(key);
      }
      return ret;
    };
    for (var key in props) {
      if (props.hasOwnProperty(key) && filter(key) || props[key + '_val_bid']) {
        wrapProp(props, key, function (key, prop, args) {
          // eslint-disable-line
          var e = args[0];
          var view = e && e.currentTarget ? e.currentTarget : { dataset: {} };

          setTimeout(function () {
            stats(opts, assign({
              event_type: e && e.type === 'tap' ? 'click' : undefined,
              nm: 'mge',
              val_bid: view.dataset && view.dataset.val_bid || props[key + '_val_bid'] || key,
              val_lab: view.dataset && view.dataset.val_lab,
              val_act: view.id || undefined
            }, ev));
          }, 100);
          return prop.apply(this, args);
        });
      }
    }
  }

  function wrapProp(props, key, cb) {
    var prop = props[key] || empty;
    props[key] = function () {
      var args = [].slice.call(arguments, 0);
      return cb.call(this, key, prop, args);
    };
  }
  function empty() {}

  // 上报数据准备
  function stats(opts, ev) {
    if (!ev.val_cid) {
      throw new Error('val_cid 是必须的');
    }
    if (ev.nm !== 'mpt' && !ev.val_bid && !ev.val_act) {
      throw new Error('非mpt事件的 val_bid 或 val_act 是必须的');
    }
    if (typeof ev.val_val === 'function') {
      ev.val_val = ev.val_val();
    }
    if (typeof ev.val_lab === 'string') {
      ev.val_lab = val_lab(ev.val_lab);
    }

    if (ev.tm == null) {
      ev.tm = +new Date();
    }
    if (ev.seq == null) {
      ev.seq = SEQ();
    }
    if (ev.nt == null) {
      ev.nt = 0;
    }
    if (ev.isauto == null) {
      ev.isauto = 0;
    }

    if (!opts.env) {
      opts.env = assign({
        category: 'data_sdk_' + opts.channel,
        appnm: opts.appnm,
        app: opts.app,
        uuid: storage('stats_uuid', UUID)
      }, env);
    }
    opts.env.utm = storage('stats_utm') || undefined;
    opts.env.msid = storage('stats_msid', MSID);
    refreshMSIDExpires();

    var uid = opts.uid && opts.uid();
    if (uid) opts.env.uid = uid;

    wx.getNetworkType({
      success: function success(res) {
        opts.env.net = res.networkType.toUpperCase();
        opts.env.ua = opts.env.ua.replace(/(NetType\/).*/, '$1' + opts.env.net);

        send(opts, ev);
      }
    });
  }

  var pending;
  var sendTimer = null;
  // 上报
  function send(opts, ev, seq) {
    var evs = storage('stats_evs', function () {
      return [];
    });
    if (ev) {
      evs.push(ev);
    } else if (seq) {
      do {
        ev = evs.shift();
      } while (ev && ev.seq < seq);
      ev = null; // 复位ev 防止下面重复输出调试日志
      seq = null; // 复位seq 防止再次进入队列清除
    }
    if (opts) {
      storage('stats_opts', opts);
    } else {
      opts = storage('stats_opts');
    }
    storage('stats_evs', evs);

    // if(ev){
    //   console.warn('stats: send ev ' + ev.nm + ': ' + ev.val_cid + (ev.nm !== 'mpt' ? (', ' + ev.val_bid) : ''));
    // }

    clearTimeout(sendTimer);
    sendTimer = setTimeout(function () {
      if (evs[0] && !pending) {
        pending = 1;
        // console.warn('stats: sending evs[0] ' + evs[0].nm + ': ' + evs[0].val_cid);
        wx.request({
          method: 'POST',
          url: opts.url + '?stats_sdk',
          data: [assign({
            evs: evs
          }, opts.env)],
          header: opts.header ? opts.header() : {
            'X-Host': 'http://report.vip.sankuai.com'
          },
          success: function success(res) {
            if (res.statusCode + '' === '200') {
              seq = evs.slice(-1)[0].seq;
              // console.warn('stats: send evs success seq: ' + seq);
            }
          },
          complete: function complete() {
            // console.warn('stats: send evs complete');
            pending = 0;

            if (seq) {
              send(null, null, seq);
            } else {
              setTimeout(send, 30000);
            }
          }
        });
      }
    }, 200);
  }

  function assign(target) {
    for (var i = 1; i < arguments.length; i++) {
      var a = arguments[i];
      for (var p in a) {
        if (a.hasOwnProperty(p)) {
          target[p] = a[p];
        }
      }
    }
    return target;
  }

  function storage(k, v, opts) {
    if (typeof v === 'undefined' || typeof v === 'function') {
      var init = v;
      v = wx.getStorageSync(k);
      if (v && v.__v) {
        if (v.expires < +new Date()) {
          v = '';
        } else {
          v = v.__v; // eslint-disable-line
        }
      }
      if (v === '' && init) {
        opts = init.length ? {} : null;
        v = init(opts);
        if (typeof v !== 'undefined') {
          storage(k, v, opts);
        }
      }
      return v;
    }
    if (opts) {
      opts.__v = v; // eslint-disable-line
      v = opts;
    }
    wx.setStorageSync(k, v);
  }

  function val_lab(v) {
    if (v == null) return;
    v = ((v || '') + '').replace(/(\w+):/g, '"$1":').replace(/'/g, '\"');
    if (v) {
      try {
        v = JSON.parse(v);
      } catch (e) {
        console.error(e);
      }
    }
    return v;
  }

  var tm = +new Date();
  var seqCount = 0;

  function SEQ() {
    seqCount++;
    return +(tm + '000'.slice((seqCount + '').length) + seqCount);
  }

  function UUID() {
    var t = function t() {
      var d = 1 * new Date();
      var i = 0;
      while (d === 1 * new Date() && i < 200) {
        i++;
      }
      return d.toString(16) + i.toString(16);
    };

    var r = +(Math.random() + '').slice(2);

    var ua = env.ua || '';
    var i;
    var ch;
    var buffer = [];
    var ret = 0;

    function xor(result, byte_array) {
      var j;
      var tmp = 0;
      for (j = 0; j < byte_array.length; j++) {
        tmp |= buffer[j] << j * 8;
      }
      return result ^ tmp;
    }
    for (i = 0; i < ua.length; i++) {
      ch = ua.charCodeAt(i);
      buffer.unshift(ch & 0xFF);
      if (buffer.length >= 4) {
        ret = xor(ret, buffer);
        buffer = [];
      }
    }
    if (buffer.length > 0) {
      ret = xor(ret, buffer);
    }
    ua = ret;

    var se = 0;
    if (env.sc) {
      se = env.sc.split('*');
      se = +se[0] * +se[1];
    }

    return [t(), r, ua, se, t()].map(function (v) {
      return v.toString(16);
    }).join('-');
  }

  function MSID(opts) {
    var gen = function gen() {
      return Math.floor((1 + Math.random()) * 65536).toString(16).slice(1);
    };
    opts.expires = +new Date() + MSID_EXPIRES;
    return gen() + gen() + gen() + gen() + gen() + gen() + gen();
  }

  function refreshMSIDExpires() {
    var msid = wx.getStorageSync('stats_msid');

    msid.expires = +new Date() + MSID_EXPIRES;
    storage('stats_msid', msid);
  }
})();
'use strict';

/* eslint
  func-names: off,
  no-param-reassign: warn,
  no-trailing-spaces: off,
  vars-on-top: off,
  camelcase: warn,
  no-restricted-syntax: [error, WithStatement],
  no-plusplus: warn,
  no-prototype-builtins: warn,
  new-cap: warn,
  no-new-func: warn,
  no-bitwise: warn,
  no-var: off,
  object-shorthand: off,
  prefer-template: off,
  prefer-arrow-callback: off
*/
/**

Usage:

    <scroll-view scroll-y="true" style="{{ modal.page }}">
      foo bar ...
    </scroll-view>

    <view style="{{ modal.overlay }}" bindtap="onTapModalOverlay"></view>

    <view class="my-modal-dialog" style="{{ modal.myModalDialog }}">
      dialog balabala ...
    </view>


    var modal = require('modal');
    Page({
      onLoad: function(){
        modal(this, {
          myModalDialog: {
            height: '90%'
          }
        });
      },
      onShowXXX: function(){
        this.myModalDialog.show();
      },
      onHideXXX: function(){
        this.myModalDialog.hide();
      },
    })


*/

var overlay = {
  base: 'transition: opacity .2s ease-out; position: fixed; z-index: 100; left: 0; top: 0; background: rgba(33, 33, 33, 0.7);',
  init: 'opacity: 0;',
  show: 'opacity: 1; bottom: 0; right: 0;',
  hide: 'opacity: 0; bottom: 0; right: 0;'
};

module.exports = function (page, modals) {
  var dataModal = {
    current: [],
    page: 'position: absolute; height: 100%;',
    overlay: [overlay.base, overlay.init].join('')
  };
  var init = function init(name, opts) {
    var modal = this.data.modal;
    opts.base = 'transition: transform .2s ease-out; position: fixed; z-index: 200; left: 0; right: 0; overflow: hidden; background: #fff;';
    opts.height = opts.height || '80%';
    opts.init = 'bottom: 0; transform: translate(0, 100%); height: 0;';
    opts.show = 'bottom: 0; transform: translate(0, 0); height: ' + opts.height + ';';
    opts.hide = 'bottom: 0; transform: translate(0, 100%); height: ' + opts.height + ';';
    modal[name] = [opts.base, opts.init].join('');
    this.setData({ modal: modal });
  };
  var show = function show(name, opts) {
    var modal = this.data.modal;
    modal.current.push(name);
    modal['overlay-' + name] = modal.overlay = [overlay.base, overlay.show].join('');
    modal[name] = [opts.base, opts.show].join('');
    this.setData({ modal: modal });
  };
  var hide = function hide(name, opts) {
    var modal = this.data.modal;

    if (!modal.current || !modal.current.length) {
      return;
    }

    modal['overlay-' + name] = modal.overlay = [overlay.base, overlay.hide].join('');
    modal[name] = [opts.base, opts.hide].join('');
    this.setData({ modal: modal });

    var self = this;
    setTimeout(function () {
      var modal = self.data.modal;
      if (modal.current.slice(-1)[0] === name) {
        modal.current.pop();
      }
      modal['overlay-' + name] = modal.overlay = [overlay.base, overlay.init].join('');
      modal[name] = [opts.base, opts.init].join('');
      self.setData({ modal: modal });
    }, 200);
  };
  page.onTapModalOverlay = function () {
    var modal = this.data.modal;
    var m = modal.current.slice(-1)[0];
    if (m) {
      page[m].hide();
    }
  };
  for (var m in modals) {
    if (modals.hasOwnProperty(m)) {
      page[m] = {
        show: show.bind(page, m, modals[m]),
        hide: hide.bind(page, m, modals[m])
      };
      init.call({
        data: { modal: dataModal },
        setData: function setData() {}
      }, m, modals[m]);
    }
  }
  page.setData({ modal: dataModal });
};
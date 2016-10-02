"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var options = {};
var cache = {};
var ttlQueue = [];

var genExpire = function genExpire(seconds) {
  var t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
};

var addToTTLQueue = function addToTTLQueue(ttl) {
  for (var i = 0; i < ttlQueue.length; i++) {
    if (ttl.expires.getTime() < ttlQueue[i].expires.getTime()) {
      ttlQueue = ttlQueue.filter(function (e) {
        return e.id !== ttl.id;
      });
      ttlQueue.splice(i, 0, ttl);
      return;
    }
  }
  ttlQueue.push(ttl);
};

var cleanExpired = function cleanExpired(now) {
  if (ttlQueue.length === 0 || ttlQueue[0].expires.getTime() > now.getTime()) return;
  for (var i = 0; i < ttlQueue.length; i++) {
    if (now.getTime() < ttlQueue[i].expires.getTime()) {
      ttlQueue.splice(0, i);
      return;
    }
    delete cache[ttlQueue[i].id];
  }
  ttlQueue = [];
};

var checkExpired = function checkExpired() {
  cleanExpired(new Date());
  setTimeout(checkExpired, options.interval * 1000);
};

var _class = function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  _createClass(_class, null, [{
    key: "init",
    value: function init(o) {
      options = o || { interval: 1 };
      checkExpired();
    }
  }, {
    key: "set",
    value: function set(id, value, ttl) {
      cache[id] = value;
      if (ttl) return addToTTLQueue({ id: id, expires: genExpire(options.ttl) });
      addToTTLQueue({
        id: id,
        expires: options.randomize ? genExpire(Math.ceil(Math.random() * options.ttl)) : genExpire(options.ttl)
      });
    }
  }, {
    key: "check",
    value: function check(id) {
      return id in cache;
    }
  }, {
    key: "get",
    value: function get(id) {
      return cache[id];
    }
  }, {
    key: "del",
    value: function del(id) {
      delete cache[id];
      ttlQueue = ttlQueue.filter(function (t) {
        return t.id !== id;
      });
    }
  }, {
    key: "flush",
    value: function flush() {
      ttlQueue.map(function (t) {
        return delete cache[t.id];
      });
      ttlQueue = [];
    }
  }, {
    key: "size",
    value: function size() {
      return ttlQueue.length;
    }
  }]);

  return _class;
}();

exports.default = _class;

import { test } from 'ava';
import requireNew from 'require-new';
import Promise from 'bluebird';

const testKey = 'testKey';
const testValue = 'testValue';
const globalTTL = 2;

const testKey2 = 'testKey2';
const testValue2 = 'testValue2';
const localTTL = 3;

let cache;

test.beforeEach(() => {
  cache = requireNew('../src');
  cache.init({ ttl: globalTTL, interval: 1, randomize: false });
  cache.set(testKey2, testValue2, localTTL);
  cache.set(testKey, testValue);
});

test('get', t => {
  t.is(cache.get(testKey), testValue);
  t.falsy(cache.get(testKey + 'foo'));
});

test('check', t => {
  t.true(cache.check(testKey));
  t.false(cache.check(testKey + 'foo'));
});

test('delete', t => {
  cache.del(testKey);
  t.false(cache.check(testKey));
  t.falsy(cache.get(testKey));
});

test('flush', t => {
  cache.flush();
  t.false(cache.check(testKey));
  t.falsy(cache.get(testKey));
  t.false(cache.check(testKey2));
  t.falsy(cache.get(testKey2));
  t.is(cache.__ttlQueue().length, 0);
  const stats = cache.stats();
  Object.keys(stats).map(s => s.length ? null : t.is(stats[s], 0));
});

test.cb('ttl-global', t => {
  const cache2 = requireNew('../src');
  cache2.init({ ttl: globalTTL, interval: 1, randomize: false });
  cache2.set(testKey, testValue);
  setTimeout(() => {
    t.true(cache2.check(testKey));
    t.is(cache2.get(testKey), testValue);
  }, 1000);
  setTimeout(() => {
    t.false(cache2.check(testKey));
    t.falsy(cache2.get(testKey));
    t.end();
  }, 4000);
});

test.cb('ttl', t => {
  setTimeout(() => {
    t.true(cache.check(testKey2));
    t.is(cache.get(testKey2), testValue2);
  }, 2000);
  setTimeout(() => {
    t.false(cache.check(testKey2));
    t.falsy(cache.get(testKey2));
    t.end();
  }, 5000);
});

test('ttl-consistency', t => {
  cache.init({ ttl: globalTTL, interval: 1, randomize: true });
  let j = 0;
  while (j < 1000) {
    cache.set('wat' + j, 'watwat');
    j++;
  }
  const ttlLength = cache.__ttlQueue().length;
  t.is(ttlLength, 1002);
  cache.__ttlQueue().forEach((c, i, arr) => {
    if (i < ttlLength - 1) t.true(c.expires.getTime() <= arr[i + 1].expires.getTime());
    t.true(cache.check(c.id));
  });
});

test('ttl-err', t => {
  cache.init();
  t.throws(() => cache.set('wat', 'wat'), 'Global or local TTL needs to be set');
});

test.cb('extendOnHit', t => {
  const cache2 = requireNew('../src');
  cache2.init({ ttl: 3, interval: 1, extendOnHit: true });
  cache2.set(testKey, testValue);
  setTimeout(() => {
    t.is(cache2.get(testKey), testValue);
  }, 1000);
  setTimeout(() => {
    t.true(cache2.check(testKey));
  }, 4000);
  setTimeout(() => {
    t.false(cache2.check(testKey));
    t.end();
  }, 7000);
});

test.cb('onInterval', t => {
  const cache2 = requireNew('../src');
  let i = 0;
  cache2.init({
    ttl: 3,
    interval: 1,
    onInterval: cacheId => new Promise(res => {
      t.is(cacheId, testKey);
      i++;
      res('wat');
    }),
  });
  cache2.set(testKey, testValue);
  setTimeout(() => {
    t.is(cache2.get(testKey), 'wat');
    t.is(i, 2);
    t.end();
  }, 3000);
});

test('onInterval-err', t => {
  const cache2 = requireNew('../src');
  t.throws(() => cache2.init({
    ttl: 3,
    interval: 1,
    onInterval: true,
  }), 'onInterval needs to be a Promise/function');
});

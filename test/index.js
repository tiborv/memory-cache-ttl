import { test } from 'ava';
import cache from '../src';

const testKey = 'testKey';
const testValue = 'testValue';
const globalTTL = 2;

const testKey2 = 'testKey2';
const testValue2 = 'testValue2';
const localTTL = 3;

test.before(() => {
  cache.init({ ttl: globalTTL, interval: 1, randomize: false });
});

test.beforeEach(() => {
  cache.flush();
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
});

test.cb('ttl-global', t => {
  setTimeout(() => {
    t.true(cache.check(testKey));
    t.is(cache.get(testKey), testValue);
  }, 1000);
  setTimeout(() => {
    t.false(cache.check(testKey));
    t.falsy(cache.get(testKey));
    t.end();
  }, 3000);
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
  }, 4000);
});

test('ttl-consistency', t => {
  const ttlLength = cache.__ttlQueue().length;
  t.is(ttlLength, 2);
  cache.__ttlQueue().forEach((c, i, arr) => {
    if (i < ttlLength - 1) t.true(c.expires.getTime() <= arr[i + 1].expires.getTime());
    t.true(cache.check(c.id));
  });
});

test('ttl-err', t => {
  cache.init({ ttl: null, interval: 1, randomize: false });
  t.throws(() => cache.set('wat', 'wat'), 'Global or local TTL needs to be set');
});

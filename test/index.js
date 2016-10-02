import { test } from 'ava';
import cache from '../';

const testKey = 'testKey';
const testValue = 'testValue';
const globalTTL = 5;

const testKey2 = 'testKey2';
const testValue2 = 'testValue2';
const ttl = 3;

test.beforeEach(() => {
  cache.init({ ttl: globalTTL, interval: 1, randomize: false });
  cache.set(testKey, testValue);
  cache.set(testKey2, testValue2);
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
});

test('ttl-global', t => {
  setTimeout(() => {
    t.true(cache.check(testKey));
    t.is(cache.get(testKey), testValue);
  }, 3000);
  setTimeout(() => {
    t.false(cache.check(testKey));
    t.falsy(cache.get(testKey));
    t.end();
  }, 7000);
});

test('ttl', t => {
  cache.set(testKey2, testValue2, ttl);
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

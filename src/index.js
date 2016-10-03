let options = {};
const cache = new Map();
let ttlQueue = [];

const genExpire = seconds => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
};

const addToTTLQueue = ttl => {
  for (let i = 0; i < ttlQueue.length; i++) {
    if (ttl.expires.getTime() < ttlQueue[i].expires.getTime()) {
      ttlQueue = ttlQueue.filter(e => e.id !== ttl.id);
      ttlQueue.splice(i, 0, ttl);
      return;
    }
  }
  ttlQueue.push(ttl);
};

const cleanExpired = now => {
  if (ttlQueue.length === 0 || ttlQueue[0].expires.getTime() > now.getTime()) return;
  for (let i = 0; i < ttlQueue.length; i++) {
    if (now.getTime() < ttlQueue[i].expires.getTime()) {
      ttlQueue.splice(0, i);
      return;
    }
    cache.delete(ttlQueue[i].id);
  }
  ttlQueue = [];
};

const checkExpired = () => {
  cleanExpired(new Date());
  setTimeout(checkExpired, options.interval * 1000);
};

export default class {
  static init(o) {
    options = o || { interval: 1 };
    checkExpired();
  }

  static set(id, value, ttl) {
    cache.set(id, value);
    if (ttl) return addToTTLQueue({ id, expires: genExpire(ttl) });
    addToTTLQueue({
      id,
      expires: options.randomize ?
        genExpire(Math.ceil(Math.random() * options.ttl)) :
        genExpire(options.ttl),
    });
  }

  static check(id) {
    return cache.has(id);
  }

  static get(id) {
    return cache.get(id);
  }

  static del(id) {
    cache.delete(id);
    ttlQueue = ttlQueue.filter(t => t.id !== id);
  }

  static flush() {
    cache.clear();
    ttlQueue = [];
  }

  static __ttlQueue() {
    return ttlQueue;
  }

}

let options = {};
const cache = {};
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
    delete cache[ttlQueue[i].id];
  }
  ttlQueue = [];
};

const checkExpired = () => {
  cleanExpired(new Date());
  setTimeout(checkExpired, options.interval * 1000);
};

export default class {
  static init(o) {
    if (!o.interval) throw Error('Missing interval option');
    options = o;
    checkExpired();
  }

  static set(id, value, ttl) {
    if (options === {}) throw Error('Cache not initilized');
    cache[id] = value;
    if (ttl) return addToTTLQueue({ id, expires: genExpire(options.ttl) });
    addToTTLQueue({
      id,
      expires: options.randomize ?
        genExpire(Math.ceil(Math.random() * options.ttl)) :
        genExpire(options.ttl),
    });
  }

  static check(id) {
    if (options === {}) throw Error('Cache not initilized');
    return id in cache;
  }

  static get(id) {
    if (options === {}) throw Error('Cache not initilized');
    return cache[id];
  }

  static del(id) {
    if (options === {}) throw Error('Cache not initilized');
    delete cache[id];
    ttlQueue = ttlQueue.filter(t => t.id !== id);
  }

}

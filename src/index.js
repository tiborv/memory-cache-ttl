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

const cleanExpired = () => {
  if (ttlQueue.length === 0) return;
  const now = new Date().getTime();
  if (ttlQueue[0].expires.getTime() > now) return;
  for (let i = 0; i < ttlQueue.length; i++) {
    if (now < ttlQueue[i].expires.getTime()) {
      ttlQueue.splice(0, i);
      return;
    }
    cache.delete(ttlQueue[i].id);
  }
  ttlQueue = [];
};

let runningProcess;

const checkExpired = () => {
  if (runningProcess) clearInterval(runningProcess);
  runningProcess = setInterval(cleanExpired, options.interval * 1000);
};

export default class {
  static init(o = { interval: 1 }) {
    options = o;
    checkExpired();
  }

  static set(id, value, ttl) {
    cache.set(id, value);
    if (ttl) return addToTTLQueue({ id, expires: genExpire(ttl) });
    if (!options.ttl) throw new Error('Global or local TTL needs to be set');
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

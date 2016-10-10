let options = {};
const cache = new Map();
let ttlQueue = [];
let ttlExtend = new Set();

const genExpire = seconds => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
};

const addToTTLQueue = ttl => {
  ttlQueue = ttlQueue.filter(e => e.id !== ttl.id);
  for (let i = 0; i < ttlQueue.length; i++) {
    if (ttl.expires.getTime() < ttlQueue[i].expires.getTime()) {
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


const set = (id, value, ttl) => {
  if (!ttl && !options.ttl) throw new Error('Global or local TTL needs to be set');
  cache.set(id, value);
  if (ttl) return addToTTLQueue({ id, expires: genExpire(ttl) });
  addToTTLQueue({
    id,
    expires: options.randomize ?
      genExpire(Math.ceil(Math.random() * options.ttl)) :
      genExpire(options.ttl),
  });
};

const check = id => cache.has(id);

const get = id => {
  if (options.extendOnHit) ttlExtend.add(id);
  return cache.get(id);
};

const del = id => {
  cache.delete(id);
  ttlQueue = ttlQueue.filter(t => t.id !== id);
};

const flush = () => {
  cache.clear();
  ttlQueue = [];
};

const onInterval = () => {
  if (ttlQueue.length === 0) return;
  ttlQueue.forEach(ttl => {
    options
      .onInterval(ttl.id)
      .then((newValue = cache.get(ttl.id)) => {
        cache.set(ttl.id, newValue);
      });
  });
};


const extendOnHit = () => {
  if (ttlExtend.size === 0) return;
  ttlExtend.forEach(id => set(id, cache.get(id)));
  ttlExtend = new Set();
};

let runningProcess;
const runTasks = () => {
  if (runningProcess) clearInterval(runningProcess);
  runningProcess = setInterval(() => {
    if (options.extendOnHit) extendOnHit();
    if (options.onInterval) onInterval();
    cleanExpired();
  }, options.interval * 1000);
};

const init = (o = { interval: 1 }) => {
  options = o;
  if (o.onInterval && typeof o.onInterval !== 'function') {
    throw new Error('onInterval needs to be a Promise/function');
  }
  runTasks();
};

export default {
  init,
  set,
  get,
  check,
  del,
  flush,
  __ttlQueue: () => ttlQueue,
  stats: () => ({
    cacheSize: cache.size,
    ttlQueueSize: ttlQueue.length,
    ttlExtendSize: ttlExtend.size,
  }),
};

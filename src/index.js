import sizeof from 'object-sizeof';

let options = {};
let cache = {};
let ttlQueue = [];
let ttlExtend = new Set();

const genExpire = seconds => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
};

const sortedIndex = (array, value) => {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = low + high >>> 1; // eslint-disable-line no-bitwise
    if (array[mid].expires.getTime() < value) low = mid + 1;
    else high = mid;
  }
  return low;
};

const addToTTLQueue = ttl => {
  ttlQueue = ttlQueue.filter(e => e.id !== ttl.id);
  ttlQueue.splice(sortedIndex(ttlQueue, ttl.expires.getTime()), 0, ttl);
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
    delete cache[ttlQueue[i].id];
  }
  ttlQueue = [];
};


const set = (id, value, ttl) => {
  if (!ttl && !options.ttl) throw new Error('Global or local TTL needs to be set');
  cache[id] = value;
  if (ttl) return addToTTLQueue({ id, expires: genExpire(ttl) });
  addToTTLQueue({
    id,
    expires: options.randomize ?
      genExpire(Math.ceil(Math.random() * options.ttl)) :
      genExpire(options.ttl),
  });
};

const check = id => id in cache;

const get = id => {
  if (options.extendOnHit) ttlExtend.add(id);
  return cache[id];
};

const del = id => {
  delete cache[id];
  ttlQueue = ttlQueue.filter(t => t.id !== id);
};

const flush = () => {
  cache = {};
  ttlQueue = [];
};

const onInterval = () => {
  if (ttlQueue.length === 0) return;
  ttlQueue.forEach(ttl => {
    options
      .onInterval(ttl.id)
      .then((newValue = cache[ttl.id]) => {
        cache[ttl.id] = newValue;
      });
  });
};


const extendOnHit = () => {
  if (ttlExtend.size === 0) return;
  ttlExtend.forEach(id => set(id, cache[id]));
  ttlExtend = new Set();
};

let runningProcess;
const runTasks = () => {
  if (runningProcess) clearInterval(runningProcess);
  runningProcess = setInterval(() => {
    if (options.extendOnHit) extendOnHit();
    cleanExpired();
    if (options.onInterval) onInterval();
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
    cacheEntries: Object.keys(cache).length,
    ttlQueueEntries: ttlQueue.length,
    ttlExtendEntries: ttlExtend.size,
    cacheSize: sizeof(cache),
  }),
};

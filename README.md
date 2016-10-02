# memory-cache-ttl [![Build Status](https://travis-ci.org/tiborv/memory-cache-ttl.svg?branch=master)](https://travis-ci.org/tiborv/memory-cache-ttl)

A simple (and preformant) in-memory cache with Time To Live functionality.

## Install

    npm i memory-cache-ttl --save

## Usage

```javascript
const cache = require('memory-cache-ttl');

cache.init({ ttl: 3, interval: 1, randomize: false });

cache.set('asd', 'dsa');

console.log(cache.check('asd')); //true

console.log(cache.get('asd')); //dsa

setTimeout(() => {
  console.log(cache.check('asd')); //false
  console.log(cache.get('asd')); //undefined
}, 5000);

```

## API
### .init(settings)
  sets global options

### .set(key, value, ttl [optional])
  sets value and local TTL (seconds) for key.

### .check(key)
  returns true/false

### .get(key)
  returns value of key

### .del(key)
  deletes value of key

### .flush()
  deletes all values


## Settings
### ttl [seconds]
  sets a global TTL

### interval [seconds]
  sets TTL expiery-check interval

### randomize [boolean]
  randomizes the TTL (needs global TTL to be set)

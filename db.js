// db.js
const storage = require('node-persist');

module.exports = {
  init: () => storage.init({ dir: 'data', continuous: true, ttl: false }),
  get:    key       => storage.getItem(key),
  set:    (key, val)=> storage.setItem(key, val),
  keys:  ()        => storage.keys()   // utile pour parcourir tous les joueurs
};

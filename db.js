// db.js
const storage = require('node-persist');

module.exports = {
  init: () => storage.init({
    dir: 'data',          // dossier où seront tes JSON
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,     // écriture automatique
    ttl: false            // pas d'expiration
  }),
  get:    (key)  => storage.getItem(key),
  set:    (key, value) => storage.setItem(key, value)
};

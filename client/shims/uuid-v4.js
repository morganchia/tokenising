// react-validation 3 imports the old deep path "uuid/v4", which uuid >= 9 no longer exposes.
// Aliased in craco.config.js (webpack + jest) so it gets a patched uuid's v4().
module.exports = require('uuid').v4;

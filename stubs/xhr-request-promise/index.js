// Stand-in for xhr-request-promise, wired in via "overrides" in the root package.json.
// Only eth-lib's rpc/provider modules use it, and this project never loads those.
module.exports = function xhrRequestPromise() {
  return Promise.reject(new Error("xhr-request-promise is stubbed out in this project (see stubs/)"));
};

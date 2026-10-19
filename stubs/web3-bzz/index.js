// No-op stand-in for web3-bzz (Swarm), wired in via "overrides" in the root package.json.
// web3 constructs `new Bzz(web3)` and calls `bzz.setProvider()`; nothing in this project uses Swarm.
class Bzz {
  setProvider() {
    return false;
  }
}

module.exports = Bzz;

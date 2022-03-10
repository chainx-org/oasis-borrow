'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.getNetworkId = exports.getNetworkName = exports.contract = exports.networkNameToId = void 0
const lodash_1 = require('lodash')
exports.networkNameToId = {
  main: 1,
  goerli: 5,
  kovan: 42,
  sherpax: 1507,
  hardhat: 2137,
}
const web3s = []
exports.contract = lodash_1.memoize(
  (web3, { abi, address }) => new web3.eth.Contract(abi.default, address),
  (web3, { address }) => {
    if (web3s.indexOf(web3) < 0) {
      web3s[web3s.length] = web3
    }
    return `${web3s.indexOf(web3)}${address}`
  },
)
function getNetworkName() {
  const name = 'network'
  const defaultNetwork = 'main'
  const matchesIfFound = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  if (lodash_1.isNull(matchesIfFound)) {
    return defaultNetwork
  }
  const networkName = decodeURIComponent(matchesIfFound[1].replace(/\+/g, ' '))
  if (lodash_1.isUndefined(exports.networkNameToId[networkName])) {
    throw new Error(`Unsupported network in URL param: ${networkName}`)
  }
  return networkName
}
exports.getNetworkName = getNetworkName
function getNetworkId() {
  const networkName = getNetworkName()
  const networkId = exports.networkNameToId[networkName]
  return networkId
}
exports.getNetworkId = getNetworkId
//# sourceMappingURL=network.js.map

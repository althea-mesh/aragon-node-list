const HDWalletProvider = require('truffle-hdwallet-provider');


let mocha = {
  reporter: 'eth-gas-reporter',
  reporterOptions : { currency: 'USD' }
}

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    rinkeby2: {
      provider: function() {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          "https://sasquatch.network/rinkeby"
      )},
      network_id: '4',
      gas: 6.9e5,
      gasPrice: 150000000
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(
          process.env.MNEMONIC_MAINNET,
          "https://sasquatch.network/mainnnet"
      )},
      network_id: '1',
    },
    infura: {
      provider: function() {
       return new HDWalletProvider(
         process.env.MNEMONIC,
         "https://rinkeby.infura.io/v3/" + process.env.INFURA_API
        )
      },
      network_id: '4'
    }
  },
  mocha
}

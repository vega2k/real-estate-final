var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "fashion major canyon street twist winter uncover power vague unfair trigger shove";

module.exports = {
     // See <http://truffleframework.com/docs/advanced/configuration>
     // to customize your Truffle configuration!
     networks: {
          ganache: {
               host: "127.0.0.1",
               port: 8545,
               network_id: "*" // Match any network id
          },
          ropsten: {
               provider: function () {
                    return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/79bfa7e03d7e4af6b08d066b85cf7876');
               },
               network_id: '3',
               gas: 4500000,
               gasPrice: 10000000000,
          }
     }
};

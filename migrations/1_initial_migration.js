const Migrations = artifacts.require("Migrations");
const Web3 = require('web3');
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('../server-config.json', 'utf-8'));    

module.exports = async function (deployer) {
  // const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  // const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8546"));
  // console.log(config.admin_address);
  // await web3.eth.personal.unlockAccount(config.admin_address, "12345678", 15000);
  // if it doesn't work, try eth.coinbase.
  deployer.deploy(Migrations);
};

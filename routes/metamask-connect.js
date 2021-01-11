var express = require('express');
var router = express.Router();
var fs = require('fs')
var Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
const admin_address = '0x56B1817fFa1Ff86ebB922400155CD3bE3F734419'; // org0

router.get('/', function(req, res) {
    console.log("web3 versin", web3.version);
    let contract_address = "0x9A4BF6F0F202253Ac4885699244cCD393667B05C";
    res.render('metamask-connect', { title: 'Metamask connection',
                                     address: contract_address});
});

router.get('/org.json', function(req, res) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
    res.json(contract);
});

router.post('/addUser', async function(req, res, next) {
    console.log("web3 versin", web3.version);
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));    
    let contract_address = "0x9A4BF6F0F202253Ac4885699244cCD393667B05C";
    let balance;
    await web3.eth.getBalance(admin_address, (err, res) => {
        balance = res;
    });
    // TODO: check unique id format 
    // ...

    // TODO: check whether exist, or update list
    // ...

    // TODO: addUser
    // let contrctInstance = new Contract(contract.abi, contract_address);
    // contrctInstance.methods.getOrg(0).call({from,})
    console.log(req.body.uid);
    res.send({msg: req.body.uid+"-backend-return-"+balance/Math.pow(10, 18)});
});

module.exports = router;
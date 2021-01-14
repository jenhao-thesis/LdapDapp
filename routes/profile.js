var express = require('express');
var router = express.Router();
var fs = require('fs')
var Web3 = require('web3');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const web3 = new Web3(new Web3.providers.HttpProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;

function isAuthenticated(req,res,next){
    if (req.isAuthenticated()) {
        next();
    }
    else {
        // alert("Login first");
        req.flash('info', 'Login first.');
        res.redirect('/');
        // res.status(401).json({"message": 'User not authenticated.'});
    }
};

router.get('/', isAuthenticated, function(req, res) {
    res.render('profile', { title: 'Profile ', user: req.user});
});

router.post('/bindAccount', async function(req, res, next) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));    
    let contractInstance = new web3.eth.Contract(contract.abi, contract_address);

    let userId = req.body.uid;
    let userAddress = req.body.address;
    let txHash = 0;
    console.log("id", userId);
    console.log("address", userAddress);

    await contractInstance.methods.bindAccount(userId, userAddress).send({
        from: admin_address
    }, function(error, transactionHash) {
        if (error) {
            console.log("err", error);
        }
        else {
            txHash = transactionHash;
            console.log("Transaction hash:", transactionHash);
        }
    })

    res.send({msg: "OK, i got it, this is your transaction hash:" + txHash});
});

module.exports = router;

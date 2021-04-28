const Web3 = require('web3');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));  
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
const contractInstance = new web3.eth.Contract(contract.abi, contract_address);

const contract_ACM = JSON.parse(fs.readFileSync('./build/contracts/AccessManager.json', 'utf-8'));
const contractInstanceACM = new web3.eth.Contract(contract_ACM.abi, "0x1416D0865BFDe818E8fe96d5521C7903CF12126e");

let invalidAdd = "0x0000000000000000000000000000000000000000000000000000000000000000";

exports.testResponse = (req, res) => {
    return res.send({msg: "It's OK."});
}

exports.thirdPartyLogin = async (req, res) => {
    const {account} = req.query;

    if (account !== undefined) {
        try {
            await contractInstance.methods.getIdByOrg(account).call({from: admin_address})
            .then((result) => {
                // if (result === invalidAdd) 
                //     return res.status(500).send({msg: `Please bind first.`});
                return res.send(result);
            })
            .catch((err) => {
                return res.status(500).send({msg: `Error: ${err}`});
            });
        }
        catch (e) {
            console.log(`Error info: ${e}`);
            return res.status(500).send({msg: "call() function error."});
        }
    }
    else {
        res.status(500).send({msg: "Please provide account"});
    }
};

exports.addUser = async (req, res) => {
    const {id} = req.query;

    if (id !== undefined) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        let amount = 5000;
        let idBase = 0;
        let start = Date.now();
        let spendTime = 0;
        for (let i = 0; i < amount; ++i) {
            if (i == amount-1) {
                contractInstance.methods.addUser((idBase+i).toString()).send({from: admin_address})
                .on('transactionHash', function(hash){
                    console.log(`${i} transactionHash: ${hash}.`);
                })
                .on('receipt', function(receipt){
                    console.log(`receipt:`, receipt);
                    console.log(`Get log:`, receipt.events.AddUserEvent.returnValues);
                    spendTime = (Date.now()-start)/1000;
                    return res.send({msg: "OK", spendTime: spendTime});
                })                
            }
            else {
                contractInstance.methods.addUser((idBase+i).toString()).send({from: admin_address})
                .on('transactionHash', function(hash){
                    console.log(`${i} transactionHash: ${hash}.`);
                })                
            }
        }
        // contractInstance.methods.addUser(id).send({from: admin_address})
        // .on('transactionHash', function(hash){
        //     console.log(`transactionHash: ${hash}.`);
        //     return res.send({tx: hash});
        // })
        // .on('receipt', function(receipt){
        //     console.log(`receipt:`, receipt);
        //     console.log(`Get log:`, receipt.events.AddUserEvent.returnValues);
        //     return res.send({msg: "OK"});
        // })
        // .on('confirmation', function(confirmationNumber, receipt){
        //     console.log(`confirmation: ${confirmationNumber}`, receipt);
        // })
        // .on('error', function(error, receipt) {
        //     console.log(`error: ${error}`, receipt);
        // });        
    }
    else {
        res.status(500).send({msg: "Please provide id."})
    }
}

exports.bindAccount = async (req, res) => {
    const {id, userAddress} = req.query;
    if (id !== undefined && userAddress !== undefined) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        contractInstance.methods.bindAccount(id, userAddress).send({from: admin_address})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            console.log(`Get log:`, receipt.events.BindUserAccountEvent.returnValues);
            return res.send({msg: "OK"});
        })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
            return res.status(500).send({msg: "Error occur."});
        });        
    }
    else {
        return res.status(500).send({msg: "Please provide id and userAddress"});
    }
}

exports.authorize = async (req, res) => {
    const {attr, target, org} = req.query;
    if (attr !== undefined && target !== undefined && org !== undefined) {
        await web3.eth.personal.unlockAccount("0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C", "12345678");
        contractInstanceACM.methods.authorizeAccess(attr, target, org).send({from: "0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C"})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            console.log(`Get log:`, receipt.events.AccessAuthorization.returnValues);
            return res.send({msg: "OK"});
        })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
            return res.status(500).send({msg: "Error occur."});
        });                
    }
    else {
        res.status(500).send({msg: "Please provide attr, target, org"});
    }
}

exports.revoke = async (req, res) => {
    const {attr, target, org} = req.query;
    if (attr !== undefined && target !== undefined && org !== undefined) {
        await web3.eth.personal.unlockAccount("0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C", "12345678");
        contractInstanceACM.methods.revokeAccess(attr, target, org).send({from: "0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C"})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            console.log(`Get log:`, receipt.events.AccessRevocation.returnValues);
            return res.send({msg: "OK"});
        })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
            return res.status(500).send({msg: "Error occur."});
        });                
    }
    else {
        res.status(500).send({msg: "Please provide attr, target, org"});
    }    
}

exports.authorizeAll = async (req, res) => {
    const {attr} = req.query;
    if (attr !== undefined) {
        await web3.eth.personal.unlockAccount("0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C", "12345678");
        contractInstanceACM.methods.authorizeAll(attr).send({from: "0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C"})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            console.log(`Get log:`, receipt.events.ApprovedAuthorization.returnValues);
            return res.send({msg: "OK"});
        })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
            return res.status(500).send({msg: "Error occur."});
        });                
    }
    else {
        res.status(500).send({msg: "Please provide attr"});
    }    
}

exports.revokeAll = async (req, res) => {
    const {attr} = req.query;
    if (attr !== undefined) {
        await web3.eth.personal.unlockAccount("0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C", "12345678");
        contractInstanceACM.methods.revokeAll(attr).send({from: "0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C"})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            console.log(`Get log:`, receipt.events.ApprovedRevocation.returnValues);
            return res.send({msg: "OK"});
        })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
            return res.status(500).send({msg: "Error occur."});
        });                
    }
    else {
        res.status(500).send({msg: "Please provide attr"});
    }        
}
const Web3 = require('web3');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));  
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
const contractInstance = new web3.eth.Contract(contract.abi, contract_address);

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
        return res.status(500).send({msg: "Please provide account"});
    }
};

exports.addUser = async (req, res) => {
    const {id} = req.query;

    if (id !== undefined) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        let txHash = "";
        // await contractInstance.methods.addUser(id).send({
        //     from: admin_address,
        //     gas: 6721975
        // }, function(error, transactionHash) {
        //     if (error) {
        //         console.log("err", error);
        //     }
        //     else {
        //         console.log("Transaction hash:", transactionHash);
        //         txHash = transactionHash;
        //     }
        // })

        contractInstance.methods.addUser(id).send({from: admin_address})
        .on('transactionHash', function(hash){
            console.log(`transactionHash: ${hash}.`);
            // return res.send({tx: hash});
        })
        .on('receipt', function(receipt){
            console.log(`receipt:`, receipt);
            // console.log(`Get log:`, receipt.events.AddUserEvent.returnValues);
            return res.send({msg: "OK"});
        })
        // .on('confirmation', function(confirmationNumber, receipt){
        //     console.log(`confirmation: ${confirmationNumber}`, receipt);
        // })
        .on('error', function(error, receipt) {
            console.log(`error: ${error}`, receipt);
        });        

    }
    else {
        return res.status(500).send({msg: "Please provide id."})
    }


}

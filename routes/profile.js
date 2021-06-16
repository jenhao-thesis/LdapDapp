const express = require('express');
const router = express.Router();
const fs = require('fs')
const Web3 = require('web3');
const ldap = require('ldapjs');
const util = require('util');
const Queue = require('bull');
const user = require("../controllers/user.controller.js");
const db = require("../models");
const {
    resolve
} = require('path');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const client = ldap.createClient(config.ldap.server);

let subscribeQueue = new Queue('event subscribe', {
    redis: {
        port: config.redis.port,
        host: config.redis.host
    }
});

function listenEventByHash(txHash, dn, ms) {
    return new Promise((resolve) => {
        //   setTimeout(resolve, ms);
        let i = 0,
            limitCount = 100; // wait 100 
        let log;
        let s = setInterval(async () => {
            i++;
            console.log(`try ${i}.`);

            log = await web3.eth.getTransactionReceipt(txHash);
            
            if (i == limitCount || log !== null) {
                resolve({
                    status: (log === null) ? false : true,
                    log: log,
                    dn: dn
                });
                clearInterval(s);
            }
        }, ms);
    });
}
subscribeQueue.process(async (job) => {
    try {
        const {
            txHash,
            dn
        } = job.data;
        let result = await listenEventByHash(txHash, dn, 1000);
        return Promise.resolve(result);
    } catch (err) {
        Promise.reject(err);
    }
});

subscribeQueue.on('completed', (job, result) => {
    let receipt = result.log;
    const {
        status,
        dn
    } = result;
    console.log(dn);
    console.log(receipt);
    if (status) {
        let arrayData = [];
        for (let i = 0; i < receipt.logs.length; ++i) {
            console.log(i);
            if (receipt.logs[i].data !== "0x") {
                let start = 2; // "0x"
                while (start < receipt.logs[i].data.length) {
                    arrayData.push(receipt.logs[i].data.substring(start, start + 64));
                    start += 64;
                }
            }
        }
        console.log(arrayData);
        if (arrayData.length === 3) {
            // update user start
            let change = {
                operation: 'replace',
                modification: {
                    hashed: `0x${arrayData[2]}`,
                    idStatus: 1
                }
            };

            client.modify(dn, change, function (err) {
                if (err) console.log("error", err);
            });
            // update user end
        } else {
            console.log("logs is wrong.");
        }
    }

    console.log(`Done, subsrcibe status:${status}, jobId:${job.id}`);
});



var isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        // alert("Login first");
        req.flash('info', 'Login first.');
        res.redirect('/');
        // res.status(401).json({"message": 'User not authenticated.'});
    }
};

router.get('/', isAuthenticated, async function (req, res) {
    // Find User
    let opts = {
        filter: util.format('(cn=%s)', req.user.cn),
        scope: 'sub'
    };
    let data = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    let userObject = JSON.parse(data[0]);
    delete userObject['userpassword'];
    req.user = userObject;

    // Find Invoice
    let invoices = await db.invoice.findAll({
        where: {
            name: userObject.cn
        }
    });

    res.render('profile', {
        title: 'Profile ',
        user: userObject,
        address: contract_address,
        invoices: invoices
    });
});

router.get('/org.json', function (req, res) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
    res.json(contract);
});

router.post('/bindAccount', isAuthenticated, async function (req, res, next) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
    let contractInstance = new web3.eth.Contract(contract.abi, contract_address);

    let userId = req.body.uid;
    let userAddress = req.body.address;
    let msg = "",
        hash = "";
    let idStatus = false;

    console.log("profile id", userId);
    console.log("profile address", userAddress);

    let opts = {
        filter: util.format('(cn=%s)', req.user.cn),
        scope: 'sub',
        attributes: ['idstatus']
    };
    let searchResult = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    if (searchResult.length === 1) {
        let userObject = JSON.parse(searchResult[0]);
        idStatus = (userObject.idstatus === '0') ? false : true;
    } else {
        return res.send({
            msg: "user search error",
            status: false,
            txHash: ""
        });
    }

    if (!idStatus) {
        msg = 'Your identification card number is invalid.';
        res.send({
            msg: msg,
            status: false,
            txHash: hash
        });        
    } else {
        let hashedId = await contractInstance.methods.getId().call({
            from: userAddress
        });
        // 檢查欲綁定的ADD是否未曾使用過
        if (hashedId === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            console.log("not used before");

            // 檢查當前使用者ID是否已經有對應ADD了
            let correctAddress = await contractInstance.methods.getAddress(userId).call({
                from: admin_address
            });
            console.log(`-----> ${correctAddress}`);
            if (correctAddress !== "0x0000000000000000000000000000000000000000000000000000000000000000" && correctAddress !== userAddress) {
                msg = `Please switch your current Ethereum account to ${correctAddress}`;
                return res.send({
                    msg: msg,
                    status: false,
                    txHash: ""
                });                           
            }

            // 對要發送出去的交易做簽名
            let signedTxObj;
            let tx_builder = contractInstance.methods.bindAccount(userId, userAddress);
            let encode_tx = tx_builder.encodeABI();
            let transactionObject = {
                gas: 6721975,
                data: encode_tx,
                from: admin_address,
                to: contract_address
            }
            await web3.eth.accounts.signTransaction(transactionObject, config.admin_key, async function (error, signedTx) {
                if (error) {
                    console.log("sign error");
                } else {
                    signedTxObj = signedTx;
                }
            })

            // 發送交易
            web3.eth.sendSignedTransaction(signedTxObj.rawTransaction)
                // .on('receipt', function (receipt) {
                //     console.log(receipt);
                //     return res.send({
                //         msg: `${req.body.uid}-${receipt.transactionHash}`
                //     });
                // })
                .once('transactionHash', async function(hash){
                    let job = await subscribeQueue.add({
                        txHash: hash,
                        dn: req.user.dn
                    });
                    console.log(`Create a job, jodId: ${job.id}`);     
                    msg = `OK, i got it, this is your transaction hash: ${hash}`;
                    res.send({
                        msg: msg,
                        status: true,
                        txHash: hash
                    });               
                })
                .on('error', function (error) {
                    console.log(`Send signed transaction failed! Error message as follows.`);
                    console.log(error)
                    // return res.status(500).send({
                    //     msg: "error"
                    // });
                })
        } else {
            // ADD 曾經使用過
            // 查找LDAP SERVER DB是否有出現過這組ID
            let opts = {
                filter: util.format('(hashed=%s)', hashedId),
                scope: 'sub'
            };
            let data = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
            // DB有出現過該ID的紀錄
            if (data.length === 0) {
                let actualHashedId = await contractInstance.methods.getId(req.user.id).call({
                    from: admin_address
                });
                console.log(`actual hashed id: ${actualHashedId}`);
                console.log(`account hashed id: ${hashedId}`);
                // 檢查當前使用者的ID是否跟欲綁定的ADD對應的ID一致
                if (actualHashedId === hashedId) {
                    // update hashed to this user
                    let change = {
                        operation: 'replace',
                        modification: {
                            hashed: hashedId
                        }
                    };

                    client.modify(req.user.dn, change, function (err) {
                        if (err) console.log("error", err);
                    });

                    msg = `Your account already integrated into ${userAddress}`;
                } else {
                    let correctAddress = await contractInstance.methods.getAddress(userId).call({
                        from: admin_address
                    });
                    // msg = `Your address already binded with other id`;
                    msg = `Please switch your current Ethereum account to ${correctAddress}`;

                }
            } else {
                msg = `Your Ethereum account already binded with another ID in our service. Please switch to new one.`;
            }

            res.send({
                msg: msg,
                status: false,
                txHash: ""
            });
        }
    }
});

module.exports = router;
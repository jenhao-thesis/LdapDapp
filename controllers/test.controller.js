const Web3 = require('web3');
const fs = require('fs');
const {
    rejects
} = require('assert');
const {
    resolve
} = require('path');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
const contractInstance = new web3.eth.Contract(contract.abi, contract_address);

const contract_ACM = JSON.parse(fs.readFileSync('./build/contracts/AccessManager.json', 'utf-8'));
const contractInstanceACM = new web3.eth.Contract(contract_ACM.abi, "0x8744D03e495987c4D4135964dDc234e16F86D020");

const testPairs = JSON.parse(fs.readFileSync('./test-accounts.json', 'utf-8'));
let accounts = [];
let privates = [];
for (let pri in testPairs) {
    privates.push(pri);
    accounts.push(testPairs[pri]);
}

let invalidAdd = "0x0000000000000000000000000000000000000000000000000000000000000000";

exports.testResponse = (req, res) => {
    return res.send({
        msg: "It's OK."
    });
}

exports.thirdPartyLogin = async (req, res) => {
    const {
        account
    } = req.query;

    if (account !== undefined) {
        try {
            await contractInstance.methods.getIdByOrg(account).call({
                    from: admin_address
                })
                .then((result) => {
                    // if (result === invalidAdd) 
                    //     return res.status(500).send({msg: `Please bind first.`});
                    return res.send(result);
                })
                .catch((err) => {
                    return res.status(500).send({
                        msg: `Error: ${err}`
                    });
                });
        } catch (e) {
            console.log(`Error info: ${e}`);
            return res.status(500).send({
                msg: "call() function error."
            });
        }
    } else {
        res.status(500).send({
            msg: "Please provide account"
        });
    }
};

exports.addUser = async (req, res) => {
    const {
        id
    } = req.query;
    /*
        amount : 決定範圍
        idBase : 從哪個id開始,預設0~(amount-1)的id
        start  : 紀錄開始時間,從發送前的時間
    */
    if (id !== undefined) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        let amount = 11000;
        let idBase = 0;
        let start = Date.now();
        let spendTime = 0;
        for (let i = 0; i < amount; ++i) {
            if (i == amount - 1) {
                contractInstance.methods.addUser((idBase + i).toString()).send({
                        from: admin_address
                    })
                    .on('transactionHash', function (hash) {
                        console.log(`${i} transactionHash: ${hash}.`);
                    })
                    .on('receipt', function (receipt) {
                        console.log(`receipt:`, receipt);
                        console.log(`Get log:`, receipt.events.AddUserEvent.returnValues);
                        spendTime = (Date.now() - start) / 1000;
                        return res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
            } else {
                contractInstance.methods.addUser((idBase + i).toString()).send({
                        from: admin_address
                    })
                    .on('transactionHash', function (hash) {
                        console.log(`${i} transactionHash: ${hash}.`);
                    })
            }
        }
    } else {
        res.status(500).send({
            msg: "Please provide id."
        })
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
};

exports.bindAccount = async (req, res) => {
    const {
        id,
        userAddress
    } = req.query;
    if (id !== undefined && userAddress !== undefined) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);

        let amount = 5000;
        let idBase = 0;
        let start = Date.now();
        let spendTime = 0;

        for (let i = 0; i < amount; ++i) {
            await wait(200);
            if (i == amount - 1) {
                contractInstance.methods.bindAccount((idBase + i).toString(), accounts[idBase + i]).send({
                        from: admin_address
                    })
                    .on('transactionHash', function (hash) {
                        console.log(`${i} transactionHash: ${hash}.`);
                    })
                    .on('receipt', function (receipt) {
                        console.log(`receipt:`, receipt);
                        console.log(`Get log:`, receipt.events.BindUserAccountEvent.returnValues);
                        spendTime = (Date.now() - start) / 1000;
                        return res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
                    .on('error', function (error, receipt) {
                        console.log(`${i} error: ${error}`, receipt);
                        return res.status(500).send({
                            msg: "Error occur."
                        });
                    });
            } else {
                contractInstance.methods.bindAccount((idBase + i).toString(), accounts[idBase + i]).send({
                        from: admin_address
                    })
                    .on('transactionHash', function (hash) {
                        console.log(`${i} transactionHash: ${hash}.`);
                    })
                    .on('error', function (error, receipt) {
                        console.log(`${i} error: ${error}`, receipt);
                    });
            }
        }

    } else {
        return res.status(500).send({
            msg: "Please provide id and userAddress"
        });
    }
}

let ACMAddresses = [];
const getAllACMAddress = async (isTopUp) => {
    if (isTopUp) {
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        for (let pri in testPairs)
            web3.eth.sendTransaction({
                to: testPairs[pri],
                from: admin_address,
                value: web3.utils.toWei("10", "ether")
            })
    } else if (ACMAddresses.length === 0) {
        for (let pri in testPairs) {
            await contractInstance.methods.getAccessManagerAddress(testPairs[pri]).call({
                    from: testPairs[pri]
                })
                .then((r) => {
                    ACMAddresses.push(r);
                });
        }
    }
}

exports.authorize = async (req, res) => {
    const {
        attr,
        target,
        org
    } = req.query;
    if (attr !== undefined && target !== undefined && org !== undefined) {
        let amount = 5000;
        let idBase = 0;
        let start = 0;
        let spendTime = 0;

        let ACMAddresses = [];
        // 取得所有帳戶的合約地址,需要事前綁定過才會產生合約
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        for (let pri in testPairs) {
            await contractInstance.methods.getAccessManagerAddress(testPairs[pri]).call({
                    from: testPairs[pri]
                })
                .then((r) => {
                    ACMAddresses.push(r);
                });

            // 第一次使用帳戶 需要先儲值
            // web3.eth.sendTransaction({to:testPairs[pri], from:admin_address, value:web3.utils.toWei("10", "ether")})
        }

        // 對要發送出去的交易做簽名
        let signedTxs = [];
        for (let i = 0; i < amount; ++i) {
            let private_key = privates[idBase + i];
            let tx_builder = contractInstanceACM.methods.authorizeAccess(attr, target, org);
            let encode_tx = tx_builder.encodeABI();
            let transactionObject = {
                gas: 49263,
                data: encode_tx,
                from: accounts[idBase + i],
                to: ACMAddresses[idBase + i]
            }
            await web3.eth.accounts.signTransaction(transactionObject, private_key, async function (error, signedTx) {
                if (error) {
                    console.log("sign error");
                } else {
                    signedTxs.push(signedTx);
                }
            })
        }

        // 發送交易
        start = Date.now()
        for (let i = 0; i < amount; ++i) {
            if (i == amount - 1) {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('receipt', function (receipt) {
                        spendTime = (Date.now() - start) / 1000;
                        res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                        res.status(500).send({
                            msg: "error"
                        });
                    })
            } else {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                    })
            }
            console.log(`${i} transaction send.`);
        }
    } else {
        res.status(500).send({
            msg: "Please provide attr, target, org"
        });
    }
}

exports.revoke = async (req, res) => {
    const {
        attr,
        target,
        org
    } = req.query;
    if (attr !== undefined && target !== undefined && org !== undefined) {
        let amount = 5000;
        let idBase = 0;
        let start = 0;
        let spendTime = 0;

        let ACMAddresses = [];

        // 取得所有帳戶的合約地址,需要事前綁定過才會產生合約
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        for (let pri in testPairs) {
            await contractInstance.methods.getAccessManagerAddress(testPairs[pri]).call({
                    from: testPairs[pri]
                })
                .then((r) => {
                    ACMAddresses.push(r);
                });

            // 第一次使用帳戶 需要先儲值
            // web3.eth.sendTransaction({to:testPairs[pri], from:admin_address, value:web3.utils.toWei("10", "ether")})
        }

        // 對要發送出去的交易做簽名
        let signedTxs = [];
        for (let i = 0; i < amount; ++i) {
            let private_key = privates[idBase + i];
            let tx_builder = contractInstanceACM.methods.revokeAccess(attr, target, org);
            let encode_tx = tx_builder.encodeABI();
            let transactionObject = {
                gas: 49263,
                data: encode_tx,
                from: accounts[idBase + i],
                to: ACMAddresses[idBase + i]
            }
            await web3.eth.accounts.signTransaction(transactionObject, private_key, async function (error, signedTx) {
                if (error) {
                    console.log("sign error");
                } else {
                    signedTxs.push(signedTx);
                }
            })
        }

        // 發送交易
        start = Date.now()
        for (let i = 0; i < amount; ++i) {
            if (i == amount - 1) {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('receipt', function (receipt) {
                        spendTime = (Date.now() - start) / 1000;
                        res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                        res.status(500).send({
                            msg: "error"
                        });
                    })
            } else {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                    })
            }
            console.log(`${i} transaction send.`);
        }
    } else {
        res.status(500).send({
            msg: "Please provide attr, target, org"
        });
    }
}

exports.authorizeAll = async (req, res) => {
    const {
        attr
    } = req.query;
    if (attr !== undefined) {
        let amount = 5000;
        let idBase = 0;
        let start = 0;
        let spendTime = 0;

        let ACMAddresses = [];

        // 取得所有帳戶的合約地址,需要事前綁定過才會產生合約
        await web3.eth.personal.unlockAccount(admin_address, "12345678", 15000);
        for (let pri in testPairs) {
            await contractInstance.methods.getAccessManagerAddress(testPairs[pri]).call({
                    from: testPairs[pri]
                })
                .then((r) => {
                    ACMAddresses.push(r);
                });

            // 第一次使用帳戶 需要先儲值
            // web3.eth.sendTransaction({to:testPairs[pri], from:admin_address, value:web3.utils.toWei("10", "ether")})
        }

        // 對要發送出去的交易做簽名
        let signedTxs = [];
        for (let i = 0; i < amount; ++i) {
            let private_key = privates[idBase + i];
            let tx_builder = contractInstanceACM.methods.authorizeAll(attr);
            let encode_tx = tx_builder.encodeABI();
            let transactionObject = {
                gas: 49263,
                data: encode_tx,
                from: accounts[idBase + i],
                to: ACMAddresses[idBase + i]
            }
            await web3.eth.accounts.signTransaction(transactionObject, private_key, async function (error, signedTx) {
                if (error) {
                    console.log("sign error");
                } else {
                    signedTxs.push(signedTx);
                }
            })
        }

        // 發送交易
        start = Date.now()
        for (let i = 0; i < amount; ++i) {
            if (i == amount - 1) {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('receipt', function (receipt) {
                        spendTime = (Date.now() - start) / 1000;
                        res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                        res.status(500).send({
                            msg: "error"
                        });
                    })
            } else {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                    })
            }
            console.log(`${i} transaction send.`);
        }
    } else {
        res.status(500).send({
            msg: "Please provide attr"
        });
    }
}

exports.revokeAll = async (req, res) => {
    const {
        attr
    } = req.query;
    if (attr !== undefined) {
        let amount = 5000;
        let idBase = 0;
        let start = 0;
        let spendTime = 0;

        await getAllACMAddress(false);

        // 對要發送出去的交易做簽名
        let signedTxs = [];
        for (let i = 0; i < amount; ++i) {
            let private_key = privates[idBase + i];
            let tx_builder = contractInstanceACM.methods.revokeAll(attr);
            let encode_tx = tx_builder.encodeABI();
            let transactionObject = {
                gas: 49263,
                data: encode_tx,
                from: accounts[idBase + i],
                to: ACMAddresses[idBase + i]
            }
            await web3.eth.accounts.signTransaction(transactionObject, private_key, async function (error, signedTx) {
                if (error) {
                    console.log("sign error");
                } else {
                    signedTxs.push(signedTx);
                }
            })
        }

        // 發送交易
        start = Date.now()
        for (let i = 0; i < amount; ++i) {
            if (i == amount - 1) {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('receipt', function (receipt) {
                        spendTime = (Date.now() - start) / 1000;
                        res.send({
                            msg: "OK",
                            spendTime: spendTime
                        });
                    })
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                        res.status(500).send({
                            msg: "error"
                        });
                    })
            } else {
                web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                    .on('error', function (error) {
                        console.log(`${i} Send signed transaction failed.`, error);
                    })
            }
            console.log(`${i} transaction send.`);
        }

        // await web3.eth.personal.unlockAccount("0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C", "12345678");
        // contractInstanceACM.methods.revokeAll(attr).send({
        //         from: "0xdda40158A7d802AB0D1CaB76a2371bD04A78f26C"
        //     })
        //     .on('transactionHash', function (hash) {
        //         console.log(`transactionHash: ${hash}.`);
        //     })
        //     .on('receipt', function (receipt) {
        //         console.log(`receipt:`, receipt);
        //         console.log(`Get log:`, receipt.events.ApprovedRevocation.returnValues);
        //         return res.send({
        //             msg: "OK"
        //         });
        //     })
        //     .on('error', function (error, receipt) {
        //         console.log(`error: ${error}`, receipt);
        //         return res.status(500).send({
        //             msg: "Error occur."
        //         });
        //     });
    } else {
        res.status(500).send({
            msg: "Please provide attr"
        });
    }
}

exports.testOnce = async (req, res) => {
    let attr = 'deposit';
    let target = '0x1F7F0F7BE634D340EB070F3F3C21B6CE4AB857BD';
    let org = '0xA3E898C280220BF5FAE9E7E6CEB4F3A6BFA67163';

    let amount = 1;
    let idBase = 0;
    let start = 0;
    let spendTime = 0;

    let ACMAddresses = ['0x251Ac9a7eB10561445a1EFAb33e365Dba6EdeE18'];
    // 對要發送出去的交易做簽名
    let signedTxs = [];
    for (let i = 0; i < amount; ++i) {
        let private_key = '661de2b371b992c50a1f041169dc0557a1709788f91556bb2a1cbf60e7acf89e';
        let tx_builder = contractInstanceACM.methods.authorizeAccess(attr, target, org);
        let encode_tx = tx_builder.encodeABI();
        let transactionObject = {
            gas: 49263,
            data: encode_tx,
            from: '0x2580Ca0Bebe1A25191c0C950fd9839a5f3cFF172',
            to: ACMAddresses[idBase + i]
        }
        await web3.eth.accounts.signTransaction(transactionObject, private_key, async function (error, signedTx) {
            if (error) {
                console.log("sign error");
            } else {
                signedTxs.push(signedTx);
            }
        })
    }

    // 發送交易
    start = Date.now()
    for (let i = 0; i < amount; ++i) {
        if (i == amount - 1) {
            web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                .on('receipt', function (receipt) {
                    spendTime = (Date.now() - start) / 1000;
                    res.send({
                        msg: "OK",
                        spendTime: spendTime
                    });
                })
                .on('error', function (error) {
                    console.log(`${i} Send signed transaction failed.`, error);
                    res.status(500).send({
                        msg: "error"
                    });
                })
        } else {
            web3.eth.sendSignedTransaction(signedTxs[i].rawTransaction)
                .on('error', function (error) {
                    console.log(`${i} Send signed transaction failed.`, error);
                })
        }
        console.log(`${i} transaction send.`);
    }


}
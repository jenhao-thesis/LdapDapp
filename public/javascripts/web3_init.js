var web3 = require('web3');

window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
            // Acccounts now exposed
            web3.eth.sendTransaction({/* ... */});
        } catch (error) {
            // User denied account access...
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
        // Acccounts always exposed
        web3.eth.sendTransaction({/* ... */});
    }
    // Non-dapp browsers...
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
});

// const ethEnabled = () => {
//     if (window.ethereum) {
//       window.web3 = new Web3(window.ethereum);
//       window.ethereum.enable();
//       ethereum.request({ method: 'eth_requestAccounts' })
//       alert("Get metamask successfully.");
//       return true;
//     }
//     return false;
// }

// if (!ethEnabled()) {
//     alert("Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp!");
// }


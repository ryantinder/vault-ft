//scripts/index.js
const Web3 = require('web3');
const axios = require('axios')
const Tx = require('ethereumjs-tx').Transaction;
async function mint () {
  try {
    const {etherscanApiKey, alchemyApiKey, privateKey, privateKey2} = require('../secrets.json');
    const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`);
    //Instantiate contract
    const CONTRACT_ADDRESS = '0xfd94d41affc5b8a2391cbf0890d0e9ed7cdfd9fd'

    const abi_request = await axios.get(`https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=${CONTRACT_ADDRESS}&apikey=${etherscanApiKey}`)
    if (abi_request == null || abi_request.statusText != 'OK') {
      throw new Error("Error in abi retrieval.")
    }
    //console.log(abi_request.data.result);
    const abi = JSON.parse(abi_request.data.result)

    let contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

    const from = '0x5cAE1f8cA829183a237f1A795111a52D0eA50757';
    const to   = '0x5cAE1f8cA829183a237f1A795111a52D0eA50757';
    //Configure private key before execution
    const pk = Buffer.from(privateKey2, 'hex')

    let estimateGas;
    await contract.methods.mint(to, 'https://ipfs.io/ipfs/QmXDsHiSq3JANfKQ32zfaFdRctdHgKeZpA5JxvteDY3HGX')
    .estimateGas(function(err, gas) {
      estimateGas = gas;
    });

    const encodedABI = contract.methods.mint(to, 'https://ipfs.io/ipfs/QmXDsHiSq3JANfKQ32zfaFdRctdHgKeZpA5JxvteDY3HGX').encodeABI()
    let nonce = await web3.eth.getTransactionCount(from)
    const rawTx = {
      from: from,
      nonce: `0x${nonce.toString(16)}`,
      gasPrice: 3e9,
      gas: estimateGas,
      to: contract.options.address,
      data: encodedABI,
    };

    const tx = new Tx(rawTx, {'chain':'ropsten'});
    tx.sign(pk);
    const serializedTx = tx.serialize();

    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('receipt', console.log);

    console.log("Mint successful.");


  } catch (error) {
    console.error(error);
  }
}
mint().then()

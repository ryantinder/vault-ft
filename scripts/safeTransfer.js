//scripts/index.js
const Web3 = require('web3');
const axios = require('axios')
const Tx = require('ethereumjs-tx').Transaction;
const {alchemyApiKey, etherscanApiKey} = require('../secrets.json');
const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`);
const write = require('./write')
const {ethers} = require('ethers')
async function safeTransfer(owner, to, token, pk) {
  try {

    if (typeof owner != 'string') {
      throw new Error("From param must be string")
    }
    if (typeof to != 'string') {
      throw new Error("To param must be string")
    }
    if (typeof token != 'object') {
      throw new Error("Token param must be Token")
    }
    if (typeof pk != 'string') {
      throw new Error("pkInput param must be string")
    }
    //Instantiate contract

    let contract = new web3.eth.Contract(token.abi, token.tx.contractAddress);
    //Configure private key before execution
    pk = Buffer.from(pk, 'hex')

    let estimateGas;
    await contract.methods.safeTransferFrom(owner, to, token.tx.tokenID)
    .estimateGas({
      from: owner
    },
      function(err, gas) {
      estimateGas = gas;
    });

    const encodedABI = contract.methods.safeTransferFrom(owner, to, token.tx.tokenID).encodeABI();
    let nonce = await web3.eth.getTransactionCount(owner)
    const rawTx = {
      from: owner,
      nonce: `0x${nonce.toString(16)}`,
      gasPrice: 2e9,
      gas: estimateGas,
      to: contract.options.address,
      data: encodedABI,
    };

    const tx = new Tx(rawTx, {'chain':'ropsten'});
    tx.sign(pk);
    const serializedTx = tx.serialize();

    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('receipt', (receipt) => {
      console.log(receipt);
      return receipt;
    });
  } catch (error) {
    console.error(error);
  }
}

async function authorizedTransfer(owner, receipient, token, recPK) {
  try {

    if (typeof owner != 'string') {
      throw new Error("From param must be string")
    }
    if (typeof receipient != 'string') {
      throw new Error("To param must be string")
    }
    if (typeof token != 'object') {
      throw new Error("Token param must be Token")
    }
    if (typeof recPK != 'string') {
      throw new Error("pkInput param must be string")
    }
    //Instantiate contract

    let contract = new web3.eth.Contract(token.abi, token.tx.contractAddress);
    //Configure private key before execution
    recPK = Buffer.from(recPK, 'hex')

    let estimateGas;
    await contract.methods.safeTransferFrom(owner, receipient, token.tx.tokenID.toString())
    .estimateGas({
      from: owner
    },
      function(err, gas) {
      estimateGas = gas;
    });

    const encodedABI = contract.methods.safeTransferFrom(owner, receipient, token.tx.tokenID.toString()).encodeABI();
    let nonce = await web3.eth.getTransactionCount(receipient)
    const rawTx = {
      from: receipient,
      nonce: `0x${nonce.toString(16)}`,
      gasPrice: 2e9,
      gas: estimateGas,
      to: contract.options.address,
      data: encodedABI,
    };

    const tx = new Tx(rawTx, {'chain':'ropsten'});
    tx.sign(recPK);
    const serializedTx = tx.serialize();

    let receipt;
    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('receipt', (res) => {
      console.log(res);
      receipt = res;
    });
    return receipt;
  } catch (error) {
    console.error(error);
  }
}

async function ethTransfer(sender, amount, destination, PK) {
  const provider = new ethers.providers.EtherscanProvider("ropsten", etherscanApiKey)
  const wallet = await write.connectToWallet(PK, provider)
  const val = amount.toString()

  let tx = write.newTransaction(destination, val)
  await write.signTransaction(tx, wallet)
  await write.sendTransaction(tx, wallet)
}
module.exports = {safeTransfer, authorizedTransfer, ethTransfer};

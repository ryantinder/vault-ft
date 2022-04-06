const Web3 = require('web3');
const {alchemyApiKey} = require('../secrets.json')
const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`);
const Tx = require('ethereumjs-tx').Transaction;
const { ethers } = require('ethers')
const eProvider = new ethers.providers.AlchemyProvider("mainnet")
//Approve the operator to transact token
async function approveAddress(from, operator, token, pk) {
  //Check if operator is already approved
  try {
    const currentOperator = await pollApproval(token);
    if (currentOperator != null && currentOperator == operator) {
      return `ADDRESS (${operator}) is already approved for ${token.tx.contractAddress}[${token.tx.tokenID}]`
    }

    //Approval transaction
    const abi = token.abi;
    const contractAddress = token.tx.contractAddress;
    const contract = new web3.eth.Contract(abi, contractAddress);

    const latestBlock = await eProvider.getBlock('latest');
    const feeData = await eProvider.getFeeData();
    const baseFee = latestBlock.baseFeePerGas;

    const encodedABI = contract.methods.approve(operator, token.tx.tokenID).encodeABI()
    let nonce = await web3.eth.getTransactionCount(from)
    pk = Buffer.from(pk, 'hex')
    const rawTx = {
      nonce: `0x${nonce.toString(16)}`,
      to: contract.options.address,
      gasPrice: 3e9,
      gas: 100000,
      from: from,
      data: encodedABI,
    };

    rawTx.gas = await web3.eth.estimateGas(rawTx);
    const tx = new Tx(rawTx, {'chain':'ropsten'});
    tx.sign(pk);
    const serializedTx = tx.serialize();

    let result;
    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('receipt', (receipt) => {
      result = [ "Approval response received", receipt ];
    });
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
}

//Executed from buyer
async function pollApproval(token) {
  try {
    const abi = token.abi;
    const contractAddress = token.tx.contractAddress;
    const contract = new web3.eth.Contract(abi, contractAddress);

    let result;
    await contract.methods.getApproved(token.tx.tokenID).call((err, res) => {
      if (!err && res != null) {
        result = res;
      } else {
        result = err;
      }
    })
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
}

module.exports = {approveAddress, pollApproval}

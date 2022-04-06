const Web3 = require('web3');
const {alchemyApiKey, etherscanApiKey} = require('../secrets.json')
const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`);
const BigNumber = require('bignumber.js')
const { ethers } = require('ethers')
const eProvider = new ethers.providers.AlchemyProvider("ropsten", alchemyApiKey)
const { parseEther, formatUnits } = require("ethers/lib/utils")

async function estApprovalCost() {
  const units = new BigNumber('40000');
  //Average gwei gas 250?
  return units.multipliedBy(250).dividedBy(10e9).toString();
}
async function estEthTransferCost(amount, to) {
  if (typeof amount == 'number') {
    amount = amount.toString()
  }
  const basicTransaction = {
    to: to,
    value: parseEther(amount)
  }

  let gasUnits;
  await eProvider.estimateGas(basicTransaction).then((gasEstimate) => {
    gasUnits = formatUnits(gasEstimate, "gwei")
  });
  return gasUnits.toString();
}

async function estTokenTransferCost(token, buyerAddress) {
  let abi = token.abi;
  let contractAddress = token.tx.contractAddress;
  let contract = new web3.eth.Contract(abi, contractAddress);

  let gasUnits;
  await contract.methods.safeTransferFrom(token.tx.to, buyerAddress, token.tx.tokenID)
  .estimateGas({
    from: token.tx.to,
    gas: 100000
  }, function(err, gas) {
    gasUnits = gas;
  });

  let feeData = await eProvider.getFeeData();
  delete feeData.gasPrice

  let latestBlock = await eProvider.getBlock('latest')
  let baseFee = latestBlock.baseFeePerGas;
  // console.log("Max Fees: " + feeData.maxFeePerGas.toString());
  // console.log("Max Priority: " + feeData.maxPriorityFeePerGas.toString());
  // console.log("Base Fee: " + latestBlock.baseFeePerGas.toString());

  //Slowest block time: baseFee + maxPriorityFeePerGas
  //Medium block time: (maxFeePerGas - baseFee) / 2 + maxPriorityFeePerGas
  //Fastest block time: maxFeePerGas - maxPriorityFeePerGas
  //[--[slowest]-----------------[medium]--------------------[fastest]--]
  //Default: slowest

  //Arithmetic

  let maxFeePerGas = new BigNumber(feeData.maxFeePerGas.toString())
  baseFee = new BigNumber(latestBlock.baseFeePerGas.toString())
  let maxPriorityFeePerGas = new BigNumber(feeData.maxPriorityFeePerGas.toString())

  let result = baseFee.plus(maxPriorityFeePerGas).plus(maxPriorityFeePerGas)

  //console.log(result.toString());
  return result.dividedBy(10e18).multipliedBy(gasUnits).toString()
}

module.exports = { estTokenTransferCost, estEthTransferCost, estApprovalCost}

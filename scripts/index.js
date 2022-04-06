const {getTokensByAccount, balanceByAccount} = require('./txByAccount.js')
const {safeTransfer, authorizedTransfer, ethTransfer} = require('./safeTransfer.js')
const {privateKey, privateKey2} = require('../secrets.json')
const {estTokenTransferCost, estEthTransferCost, estApprovalCost} = require('./estTxCost.js')
const {putAddress, getAddress, deleteAddress} = require('./aws.js')
const {approveAddress, pollApproval} = require('./approval.js')
const BigNumber = require('bignumber.js')
const axios = require('axios')
async function main() {

  //const newT = await axios.get("https://jsonplaceholder.typicode.com/todos/1");
  //console.log(newT);

  //const sellerAddress = '0x782A8449bfaC9c8690937bcBf77f72f19505E025'
  //const sellerCollection = await getTokensByAccount(sellerAddress);

  const buyerAddress = '0x5cAE1f8cA829183a237f1A795111a52D0eA50757'

  console.log("Seller: Here are my tokens")

  const buyerCollection = await getTokensByAccount(buyerAddress);

  for (const token of buyerCollection) {
    console.log(token.tx.contractAddress);
    console.log(token.tx.tokenID);
    if (token.tx.contractAddress === '0xfd94d41affc5b8a2391cbf0890d0e9ed7cdfd9fd' && token.tx.tokenID === '5') {
      continue;
    }
    if (token.tx.contractAddress === '0xfd94d41affc5b8a2391cbf0890d0e9ed7cdfd9fd' && token.tx.tokenID === '6') {
      continue;
    }
    if (token.tx.contractAddress === '0x9a67dc13e28b288533c45c61a34f928a8e23a463' && token.tx.tokenID === '1') {
      continue;
    }
    await safeTransfer(buyerAddress, '0x782A8449bfaC9c8690937bcBf77f72f19505E025', token, privateKey2)
  }
  exit(-1)
  console.log("Seller: I picked token 1 to transfer");
  const token = sellerCollection[0];
  console.log(token);

  console.log("Seller: Selling it for 1 ETH");
  token.setSellPrice(1.5);

  /*
  * BUYER SCANS
  */

  //Generate QR, scanned by buyer, now on buyer's phone
  console.log("Buyer: Scanned QR Code");
  const receivedJson = {
    sellerAddress,
    token
  }

  console.log("Buyer : Sending buyer address to cloud");
  const uploadReceipt = await putAddress(sellerAddress, buyerAddress, token)
  console.log(uploadReceipt);

  //First estimate cost of gas to transfer token
  let tokenTxEst = await estTokenTransferCost(token, buyerAddress) //returns gas units
  console.log("Buyer: Estimated cost of token tx: " + tokenTxEst);
  //Next estimate cost of sending sellPrice eth
  let ethTxEst = await estEthTransferCost(token.sellPrice, sellerAddress)
  console.log("Buyer: Estimated cost of eth tx: " + ethTxEst);
  //Finally need estimate cost of approval
  let estApprvlCost = await estApprovalCost();
  console.log("Buyer: Estimated cost of approval: " + estApprvlCost)

  tokenTxEst = new BigNumber(tokenTxEst)
  ethTxEst = new BigNumber(ethTxEst)
  estApprvlCost = new BigNumber(estApprvlCost)
  const sum = estApprvlCost.plus(new BigNumber(token.sellPrice.toString()))
  console.log("Total cost of transaction: " + sum);

  // Back on sellers phone
  console.log("Seller: I need the buyer's address to approve \"");
  const fetchBuyerAddress = await getAddress(sellerAddress)

  console.log("Seller: Got something back, lets see if it matches");
  let sellersBuyerAddress;
  if (fetchBuyerAddress.Item.sellerAddress == sellerAddress && fetchBuyerAddress.Item.contractAddress == token.tx.contractAddress && fetchBuyerAddress.Item.tokenId == token.tx.tokenID) {
    sellersBuyerAddress = fetchBuyerAddress.Item.buyerAddress.toString();
    console.log("Seller: Received address successfully: " + sellersBuyerAddress);
  }

  const deleteAddressReceipt = await deleteAddress(sellerAddress);
  console.log(deleteAddressReceipt);
  console.log("Seller: Deleted aws entry");

  //Approvals
  console.log("Seller: Approving buyer's address to transact");
  const approveReceipt = await approveAddress(sellerAddress, sellersBuyerAddress, token, privateKey);
  console.log(approveReceipt);

  console.log("Buyer : Let's see if I've been approved yet?");
  const pollReceipt = await pollApproval(token);
  console.log(pollReceipt);


  console.log(pollReceipt == buyerAddress);

  // Execute authorized transfer, Buyer's phone
  console.log("Executing authorized transfer");
  const receipt = await authorizedTransfer(sellerAddress, buyerAddress, token, privateKey2)
  console.log(receipt);

  //Execute eth transfer, Buyer's phone
  console.log("Sending price + fees");
  const ethReceipt = await ethTransfer(buyerAddress, sum, sellerAddress, privateKey2)
  console.log(ethReceipt);

}
main().then();

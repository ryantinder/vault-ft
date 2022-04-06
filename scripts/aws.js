const axios = require('axios');
const { awsUrl } = require('../secrets.json')
//Invoked by buyer
async function putAddress(theirAddress, myAddress, token) {
  let object = {
          sellerAddress: theirAddress,
          buyerAddress: myAddress,
          contractAddress: token.tx.contractAddress,
          tokenId: token.tx.tokenID.toString()
        }
  // let config = {
  //   headers: {
  //     Authorization: awsApiKey
  //   }
  // }
  try {
    const result = await axios.put(awsUrl + "/items", object)
    return result.data;
  } catch (error) {
    console.log(error);
    return error;
  }
}
//Invoked by seller
async function getAddress(myAddress) {
  try {
    const result = await axios.get(awsUrl + "/items/" + myAddress)
    return result.data;
  } catch (error) {
    console.log(error);
    return error;
  }
}
//Invoked by either to delete record
async function deleteAddress(myAddress) {
  try {
    const result = await axios.delete(awsUrl + "/items/" + myAddress)
    return result.data
  } catch (error) {
    console.log(error);
    return error;
  }
}
module.exports = {putAddress, getAddress, deleteAddress}

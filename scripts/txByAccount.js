//scripts/index.js
const Web3 = require('web3');
const axios = require('axios')
const {Token} = require('../model/token.js')
const {ethers} = require('ethers')
const {alchemyApiKey, etherscanApiKey} = require('../secrets.json');
const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`);
//  tx = {
//     blockNumber: '11738658',
//     timeStamp: '1641140429',
//     hash: '0x769e6c7837ee3945adc1849f4b1ccaf06f3b1f258c64034f5a86cf50b628d012',
//     nonce: '14',
//     blockHash: '0x1c5512282c1538960eb58241fe0d7a4e7a321297170b0afff8ddb3119206f67a',
//     from: '0x0000000000000000000000000000000000000000',
//     contractAddress: '0x9a67dc13e28b288533c45c61a34f928a8e23a463',
//     to: '0x5cae1f8ca829183a237f1a795111a52d0ea50757',
//     tokenID: '1',
//     tokenName: 'TinderFT',
//     tokenSymbol: 'TFT',
//     tokenDecimal: '0',
//     transactionIndex: '2',
//     gas: '5500000',
//     gasPrice: '1500000009',
//     gasUsed: '183133',
//     cumulativeGasUsed: '603370',
//     input: 'deprecated',
//     confirmations: '9772'
//   }
async function getTokensByAccount(accountInput) {
    try {

      let account;
      if (typeof accountInput == 'string') {
        account = accountInput;
      } else {
        throw new Error("Invalid account" + accountInput.toString());
      }
      //Get transaction log
      const data = await axios.get(`https://api-ropsten.etherscan.io/api?module=account&action=tokennfttx&address=${account}&startblock=0&endblock=27025780&sort=asc&apikey=${etherscanApiKey}`)
      if (data == null || data.statusText != 'OK') {
        throw new Error("Error in data retrieval.")
      }
      let txLog = data.data.result;

      let collection = []
      //need to filter out (IN -> OUT) pairs
      let contractGroups = groupBy(txLog, tx => tx.contractAddress)
      for (contractGroup of contractGroups) {
        contractGroup = groupBy(contractGroup[1], tx => tx.tokenID)
        for (tokenIdGroup of contractGroup) {
          if (tokenIdGroup[1].length % 2 == 0) { //even number of elements, continue
            continue
          } else if (tokenIdGroup[1].length > 1) {
            tokenIdGroup[1] = [ tokenIdGroup[1].pop() ]
          } //tokenIdGroup[1] is all of the final transactions belonging to one contract
          const abi = await getABI(tokenIdGroup[1][0].contractAddress);
          if (abi != null) {
            await Promise.all(tokenIdGroup[1].map(async (tx) => {
              try {
                let token = await createToken(tx, abi)
                collection.push(token)
              } catch (error) {
                console.log(error);
                console.log(error.stackTrace)
              }
            }));
          } else {
            console.log("ABI error for contract: " + contract[0].contractAddress)
          }
        }
      }

      //console.log(contractGroups);
      // const tx = data.data.result[0]; //is iterable
      // console.log(tx);
      // let token = await createToken(tx);

      // Sort tokens into groups of unique contracts

      return collection;
    } catch (err) {
      console.log(err)
    }
};

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}

async function getABI(contractAddress) {

  let abi_request;
  try {
    abi_request = await axios.get(`https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`)
  } catch (error) {
    console.log("Error during abi http request");
    console.log(error);
    return null;
  }

  if (abi_request == null) {
    return null;
  } else if (abi_request.statusText != 'OK') {
    console.log(abi_request.data.result);
    return null;
  }
  //console.log(abi_request.data.result)
  let abi;
  try {
    abi = JSON.parse(abi_request.data.result)
  } catch (error) {
    console.log("ABI Parsing failure");
    return null;
  }
  return abi;
}

async function createToken(tx, abi) {
  //Start of foreach loop
  //Get contract addres for transaction
  const contractAddress = tx.contractAddress
  //Get abi for ontract address
  //EXCEPTION if abi is not verified, no operations are supported??, maybe try a partial template supporting ownerOf, safeTransferFrom, approve?

  //Instantiate contract
  //param contractAddress must exist
  //param abi might exist

  //let contract = new web3.eth.Contract(abi, contractAddress);
  let provider = new ethers.providers.AlchemyProvider("ropsten", alchemyApiKey);
  const hr_abi = ["function tokenURI(uint256 tokenId) view returns (string)" ];
  console.log(hr_abi);
  let contract = new ethers.Contract(contractAddress, hr_abi, provider)

  //Parse token ID for token
  const tokenId = parseInt(tx.tokenID)
  //Fetch IPFS string for metadata, ERC721URIStorage call
  //EXCEPTION, contract does not implement ERC721URIStorage, tokenURI() doesn't exist
  let tokenURI;
  try {
    //tokenURI = await contract.methods.tokenURI(tokenId).call()
    tokenURI = await contract.tokenURI(tokenId)

  } catch (error) {
    if (error.constructor === TypeError) {
      console.log("Contract does not implement ERC721URIStorage")
    }
  }
  //Fetch metadata response from HTTP, parsing tokenURI for URL form, IPFS form, and CID form
  let metadata_request;
  try {
    //Base case, tokenURI in full URL form
    metadata_request = await axios.get(tokenURI);
  } catch (error) {
    try {
      // Case 2, tokenURI in ipfs form
      metadata_request = await axios.get("https://" + tokenURI);
    } catch (error) {
      try {
        //Case 3, tokenURI in CID form
        metadata_request = await axios.get("https://ipfs.io/ipfs/" + tokenURI);
      } catch (error) {
        metadata_request = null;
      }
    }
  }

  let metadata = null;
  let imgLink
  if (metadata_request != null && metadata_request.statusText == 'OK') {
    //Parse metadata from response
    metadata = metadata_request.data
    //Parse image link from metadata, first trying OpenSea standard, then Enjin standard
    if (metadata.image != undefined) {
      imgLink = metadata.image;
    } else if (metadata.properties.image.description != undefined){
      imgLink = metadata.properties.image.description;
    } else {
      imgLink = null;
    }
  }
  if (metadata != undefined && imgLink != undefined) {
    return new Token(tx, abi, metadata, imgLink);
  } else if (metadata != undefined && imgLink == undefined) {
    return new Token(tx, abi, metadata);
  } else {
    return new Token(tx, abi);
  }
}

async function balanceByAccount(account) {
  return await web3.eth.getBalance(account);
}
module.exports = {getTokensByAccount, balanceByAccount}

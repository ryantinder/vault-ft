// migrations/2_deploy.js
const TinderFT = artifacts.require('TinderFT');
// const GameItem = artifacts.require('GameItem');
module.exports = async function (deployer) { await deployer.deploy(TinderFT); }

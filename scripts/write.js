const { ethers } = require("ethers");
const { parseEther} = require("ethers/lib/utils");

connectToWallet = async (privateKey, provider = null) => {
    if (provider != null) {
        return await connectToSigner(new ethers.Wallet(privateKey), provider);
    }
    return new ethers.Wallet(privateKey)
}

connectToSigner = async (wallet, provider) => {
    return wallet.connect(provider)
}

newTransaction = (target, value) => {
    return {
        to: target,
        value: parseEther(value)
    }
}

signTransaction = async (tx, wallet) => {
    wallet.signTransaction(tx)
        .then((success) => {
            console.log("Transaction successfully signed: " + success.substring(0, 10) + "...")
        }, Error("Signing failed"))
}


sendTransaction = async (tx, wallet) => {
    wallet.sendTransaction(tx)
        .then((success) => {
            console.log("Transaction sent successfully.")
            console.log("Receipt: ")
            console.log(success)
        }, Error("Sending failed"))
}


module.exports = {connectToWallet, connectToSigner, newTransaction, signTransaction, sendTransaction}

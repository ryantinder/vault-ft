class Token {

  constructor(tx, abi, metadata = null, imgLink = null) {
    this.tx = tx ?? null;
    this.abi = abi ?? null;
    this.sellPrice;
    this.currentOwner = tx.to;
    this.metadata = metadata ?? null;
    this.imgLink = imgLink ?? null;
  }
  setSellPrice(sellPrice) {
    this.sellPrice = sellPrice;
  }
}
module.exports = {Token};

const { ECPairFactory } = require('ecpair');
const axios = require('axios');
const ecc = require('tiny-secp256k1')
const bitcoin = require('bitcoinjs-lib');
const ECPair = ECPairFactory(ecc);

const TESTNET = bitcoin.networks.testnet;
const validator = (
  pubkey,
  msghash,
  signature,
) => ECPair.fromPublicKey(pubkey).verify(msghash, signature);
const keyPair2 = ECPair.fromWIF('cMwXpnmLhhLUajcMJebcVLVLnPzoAtuf3jRFhqS9hoLF6bAZxzYX', TESTNET);
const keyPair1 = ECPair.fromWIF('cRcxfffyTXqHiyFAaRxdWXnD8xbLhk7kR4y1Z9sSLDE42uAoAJ1s', TESTNET);
const keyPair3 = ECPair.fromWIF('cUNfUhgA6tXKYgc2srtw5r2PADoLoEVPZJtLtMkZ7tS6H5bAwd8P', TESTNET);
// console.log(keyPair.publicKey.toString('hex'));

const {address: Alice} = bitcoin.payments.p2wpkh({ pubkey: keyPair1.publicKey, network: TESTNET });
const { address: AliceSegWit, redeem } = bitcoin.payments.p2wsh({
  redeem: bitcoin.payments.p2ms({ m: 2, pubkeys: [keyPair1.publicKey, keyPair2.publicKey, keyPair3.publicKey], network: TESTNET }),
});
// const { address: Bob } = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey, network: TESTNET });
// const { address: David } = bitcoin.payments.p2pkh({ pubkey: keyPair3.publicKey, network: TESTNET });
console.log(Alice, AliceSegWit);
let psbt = new bitcoin.Psbt({ network: TESTNET });
psbt.addInput({
  hash: 'cb3f219e71cb6fbec7e09c16c90d43dec52bd6e556f7b95b9b49e77c8cbb4e09',
  index: 1,
  nonWitnessUtxo: Buffer.from('0200000000010155f150be1e4c1cd27b9781aeced02e573930cebf6fe9591f337d66e30bcf76700000000000ffffffff0210270000000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588ac4c9a0000000000001600141b407c3d8fe7afa5af973864193d7b5f3dfe3b05024730440220426e8c0a162e6c4aa5a6beb8c53354046b72d4667cebdc2be88e9aaa5d3ac8e8022075711be0c35961a90ab89935868882b5744b996dc41bd32fd7b54675a5ab7db0012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339ab00000000', 'hex')
})
psbt.addOutput({
  address: AliceSegWit,
  value: 10000
});
psbt.addOutput({
  address: Alice,
  value: 0.00039500 * 100000000 - 10000 - 500
})
psbt.signInput(0, keyPair1).finalizeAllInputs();
const rawTx = psbt.extractTransaction().toHex();
console.log('wait for being broadcasted: ', rawTx);

// https://mempool.space/testnet/tx/7e09ca70a9f40f3e0578bae631f65cdc5d83cb1d9345c9a76516ed99c1147805
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//         rawTx
//       ]
// }).then((res)=> console.log(res.data));


const psbt1 = new bitcoin.Psbt({ network: TESTNET });
psbt1.addInput({
  hash: '7e09ca70a9f40f3e0578bae631f65cdc5d83cb1d9345c9a76516ed99c1147805',
  index: 0,
  witnessScript: redeem.output,
  nonWitnessUtxo: Buffer.from('02000000000101094ebb8c7ce7499b5bb9f756e5d62bc5de430dc9169ce0c7be6fcb719e213fcb0100000000ffffffff02102700000000000022002005e22a39bb6e34d82c0ecfd6a40eec90df21cf8cb6af906ad81c78eafb1c82cc48710000000000001600141b407c3d8fe7afa5af973864193d7b5f3dfe3b0502483045022100b4068ded05c2dc5793e72a18f5320f6f465a12bb5ebf8a1614e37f6edd7752c80220692b5dee57f79127b0a7ece7fcc332fb60d7778c5111bb6fafb90c2c54324584012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339ab00000000', 'hex')
}).addOutputs([
  {
    address: Alice,//P2WPKH ADDRESS
    value: 500,
  },
  {
    address: AliceSegWit,
    value: 0.0001 * 100000000 - 500 - 500
  }
]).signInput(0, keyPair1).signInput(0, keyPair3).finalizeAllInputs();

const rawTx1 = psbt1.extractTransaction().toHex();
console.log('wait for being broadcasted: ', rawTx1);
// https://mempool.space/testnet/tx/2150b8357e776fed2672fce5a2b6dba2f9df56c9bd1a97525aa589ecb1e04787
axios.post('https://btc-testnet.nownodes.io', {
  "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
      "jsonrpc": "2.0",
      "id": "test",
      "method": "sendrawtransaction",
      "params": [
        rawTx1
      ]
}).then((res)=> console.log(res.data));
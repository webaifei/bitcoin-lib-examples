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

// address owns the UTXO
// input [signature, pubkey]
// output [OP_DUP, OP_HASH160, hash160(pubkey), OP_EQUALVERIFY, OP_CHECKSIG]
const { address: Alice } = bitcoin.payments.p2pkh({ pubkey: keyPair1.publicKey, network: TESTNET });
// input [signature, pubkey]
// output []
// redeem []
const { address: AliceNew } = bitcoin.payments.p2wpkh({ pubkey: keyPair1.publicKey, network: TESTNET });
// const { address: Bob } = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey, network: TESTNET });
// const { address: David } = bitcoin.payments.p2pkh({ pubkey: keyPair3.publicKey, network: TESTNET });
console.log(Alice, AliceNew);
let psbt = new bitcoin.Psbt({ network: TESTNET });
psbt.addInput({
  hash: '0ebe1a93c0bcc8c0983a76e49497d168cc0346446e6b24e01d59b18afc20408a',
  index: 1,
  nonWitnessUtxo: Buffer.from('0200000001e73a9896a192d4ec2c345b9471411b47a5d881f2c22c8181610836ccf9767520010000006a473044022065528a00fe969f9758ce3c44e7b773b3fed6593cd833b37bf58fa4dc6fb54e2c02200616ca501e9c3d55486eeaa974cebbdd1b9216027a7f571c0dafc9868db03af9012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339abffffffff0250c300000000000017a91460ff6cd0353fa0f6860be8e84f62d2605f498bfb8784781200000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588ac00000000', 'hex')
})
psbt.addOutput({
  address: AliceNew,
  value: 50000
});
psbt.addOutput({
  address: Alice,
  value: 0.012105 * 100000000 - 50000 - 500
})
psbt.signInput(0, keyPair1).finalizeAllInputs();
const rawTx = psbt.extractTransaction().toHex();
console.log('wait for being broadcasted: ', rawTx);

// https://mempool.space/testnet/tx/7076cf0be3667d331f59e96fbfce3039572ed0ceae81977bd21c4c1ebe50f155
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
  hash: '7076cf0be3667d331f59e96fbfce3039572ed0ceae81977bd21c4c1ebe50f155',
  index:0,
  nonWitnessUtxo: Buffer.from('02000000018a4020fc8ab1591de0246b6e444603cc68d19794e4763a98c0c8bcc0931abe0e010000006a47304402203bc7aaa2499f24497e99ee333100d0805d321afbeb41b263e66009f98a8847c002206942faddc5e0f3b9de9b6d55ba16f2381e9f1b6bba2cb7600fcc5e51bc742912012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339abffffffff0250c30000000000001600141b407c3d8fe7afa5af973864193d7b5f3dfe3b0540b31100000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588ac00000000', 'hex')
}).addOutputs([
  {
    address: Alice,
    value: 10000,
  },
  {
    address: AliceNew,
    value: 50000 - 10000 - 500
  }
]).signAllInputs(keyPair1).finalizeAllInputs();

const rawTx1 = psbt1.extractTransaction().toHex();
console.log('wait for being broadcasted: ', rawTx1);
// https://mempool.space/testnet/tx/cb3f219e71cb6fbec7e09c16c90d43dec52bd6e556f7b95b9b49e77c8cbb4e09
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//         rawTx1
//       ]
// }).then((res)=> console.log(res.data));
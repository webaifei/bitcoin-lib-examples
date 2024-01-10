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
const keyPair1 = ECPair.fromWIF('cMwXpnmLhhLUajcMJebcVLVLnPzoAtuf3jRFhqS9hoLF6bAZxzYX', TESTNET);
const keyPair = ECPair.fromWIF('cRcxfffyTXqHiyFAaRxdWXnD8xbLhk7kR4y1Z9sSLDE42uAoAJ1s', TESTNET);
const keyPair3 = ECPair.fromWIF('cUNfUhgA6tXKYgc2srtw5r2PADoLoEVPZJtLtMkZ7tS6H5bAwd8P', TESTNET);
// console.log(keyPair.publicKey.toString('hex'));

// address owns the UTXO
const { address: Alice } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: TESTNET });
const { address: Bob } = bitcoin.payments.p2pkh({ pubkey: keyPair1.publicKey, network: TESTNET });
const { address: David } = bitcoin.payments.p2pkh({ pubkey: keyPair3.publicKey, network: TESTNET });


console.log(Alice, Bob, David);

// 1. create a multisig address for Alice and Bob and David
const pubkeys = [keyPair.publicKey, keyPair1.publicKey, keyPair3.publicKey];
console.log(pubkeys);
// 1.1 use p2ms to create a redeem script
// 1.2 use p2sh to create a multisig address
const { address: multisigAddress, redeem } = bitcoin.payments.p2sh({
  redeem: bitcoin.payments.p2ms({ m: 2, pubkeys, network: TESTNET }),
  network: TESTNET
});
console.log('multisigAddress: ', multisigAddress);
// 2. create a transaction to send 50,000 satoshis to the multisig address
let psbt = new bitcoin.Psbt({ network: TESTNET });
psbt.addInput({
  hash: '207576f9cc36086181812cc2f281d8a5471b4171945b342cecd492a196983ae7',
  index: 1,
  nonWitnessUtxo: Buffer.from('020000000121d46bb0d88e5d77215bd08184732c06448e3486136debd0b3ae113b3c8ad0ea000000006b48304502210097578c469eced10d82142171e944b710c5ab33c107aaa442acbd0df807dcd11f022046079afcba0f820cbd8cd92f1c8d199d3908bea2b2812be9d77572ae8d0d7e18012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339abffffffff0250c30000000000001976a9140034da3455399eee451266e573fae809a0ffc16488acd23d1300000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588ac00000000', 'hex')
})
psbt.addOutputs([
  {
    address: multisigAddress,
    value: 50000
  },
  {
    address: Alice,
    value: 0.01261 * 100000000 - 50000 - 500
  }
]);
psbt.signInput(0, keyPair);
psbt.validateSignaturesOfAllInputs(validator);
psbt.finalizeAllInputs();

const txHex = psbt.extractTransaction().toHex();
console.log('wait for being broadcasted:', txHex);
// https://mempool.space/testnet/tx/0ebe1a93c0bcc8c0983a76e49497d168cc0346446e6b24e01d59b18afc20408a
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//           txHex
//       ]
// }).then((res)=> console.log(res.data));

// 3. spend the utxo owned by the multisig address to send 50,000 satoshis to David
let psbt1 = new bitcoin.Psbt({ network: TESTNET });
psbt1.addInput({
  // previous tx hash which we will spend
  hash: '0ebe1a93c0bcc8c0983a76e49497d168cc0346446e6b24e01d59b18afc20408a',
  // index of the output we will spend
  index: 0,
  // the scriptPubKey that defines the conditions needed to spend the output
  redeemScript: redeem.output,
  nonWitnessUtxo: Buffer.from('0200000001e73a9896a192d4ec2c345b9471411b47a5d881f2c22c8181610836ccf9767520010000006a473044022065528a00fe969f9758ce3c44e7b773b3fed6593cd833b37bf58fa4dc6fb54e2c02200616ca501e9c3d55486eeaa974cebbdd1b9216027a7f571c0dafc9868db03af9012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339abffffffff0250c300000000000017a91460ff6cd0353fa0f6860be8e84f62d2605f498bfb8784781200000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588ac00000000', 'hex')
});
psbt1.addOutput({
  address: David,
  value: 10000
}).addOutput({
  address: multisigAddress,
  value: 50000 - 10000 - 500
});

psbt1.signInput(0, keyPair1);
psbt1.signInput (0, keyPair);

console.log('export to base64 format: ', psbt1.toBase64())
psbt1.finalizeAllInputs();
const spendMultisigTx = psbt1.extractTransaction().toHex();
console.log('wait for being broadcasted:', spendMultisigTx);
// https://mempool.space/testnet/tx/c7d20d96eabffba7aba2a8f449dfb3afd02af1325ec3c95b12ad00a02c444b1d
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//         spendMultisigTx
//       ]
// }).then((res)=> console.log(res.data));

// 




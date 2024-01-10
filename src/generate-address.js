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
// console.log(keyPair.publicKey.toString('hex'));

// address owns the UTXO
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: TESTNET });
const { address: address1 } = bitcoin.payments.p2pkh({ pubkey: keyPair1.publicKey, network: TESTNET });


console.log(address, address1);



// create a transaction
let psbt = new bitcoin.Psbt({ network: TESTNET });
// add input which is an utxo owned by address
psbt.addInput({
  hash: 'ead08a3c3b11aeb3d0eb6d1386348e44062c738481d05b21775d8ed8b06bd421',
  index: 0,
  nonWitnessUtxo: Buffer.from('020000000001014522e72e406fd886e4d2d77031b5ede76d6f1869aea82c52cf5272f85d4df39a0000000000fdffffff020a051400000000001976a9141b407c3d8fe7afa5af973864193d7b5f3dfe3b0588acf1d5d133000000001976a914d7ca3e2ef0b2b60e4f7044144dd5ac83d8bebb8988ac024730440220743b5e9c33149f90c1202d6fc06f72c898715e8058fdd1e103192fae854fada0022007278bda92c01b682fa4309beba0aa54d268a59fd69c5acfc927ba0ccc0aefa7012102505a81929ccc6496874572f4cc5a6ef982babd0db31c5a6a69d55ee9785df55383342700', 'hex')
});

// add output to send 50,000 satoshis to address1
psbt.addOutput({
  address: address1,
  value: 50000
});

// transfer the rest to address
psbt.addOutput({
  address: address,
  value: 0.0131201 * 100000000 - 50000 - 1000
})

// sign the transaction
psbt.signInput(0, keyPair);
psbt.validateSignaturesOfAllInputs(validator);
psbt.finalizeAllInputs();

const txHex = psbt.extractTransaction().toHex();
console.log('wait for being broadcasted:', txHex);
// curl --location 'https://btc-testnet.nownodes.io' \
// --header 'Content-Type: application/json' \
// --data '{
//     "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//     "jsonrpc": "2.0",
//     "id": "test",
//     "method": "getrawtransaction",
//     "params": [
//         "0ebe1a93c0bcc8c0983a76e49497d168cc0346446e6b24e01d59b18afc20408a",
//         true
//     ]
// }'

// 
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "getrawtransaction",
//       "params": [
//           "0ebe1a93c0bcc8c0983a76e49497d168cc0346446e6b24e01d59b18afc20408a",
//           true
//       ]
// }).then((res)=> console.log(res.data));


// send the transaction
// curl --location 'https://btc-testnet.nownodes.io' \
// --header 'Content-Type: application/json' \
// --data '{
//     "API_key": "your_API_key",
//     "jsonrpc": "2.0",
//     "id": "test",
//     "method": "sendrawtransaction",
//     "params": [
//         "signedhex"
//     ]
// }'

// broadcast the transaction
// https://mempool.space/testnet/tx/207576f9cc36086181812cc2f281d8a5471b4171945b342cecd492a196983ae7
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//           txHex
//       ]
// }).then((res)=> console.log(res.data));


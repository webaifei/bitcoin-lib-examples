const { ECPairFactory } = require('ecpair');
const axios = require('axios');
const ecc = require('tiny-secp256k1')
const bitcoin = require('bitcoinjs-lib');
const ECPair = ECPairFactory(ecc);

bitcoin.initEccLib(ecc);

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

function toXonly(pubkey) {
  return pubkey.subarray(1, 33)
}
function tweakSigner(signer, opts) {
  let privateKey = signer.privateKey;
  if (!privateKey) {
      throw new Error('Private key is required for tweaking signer!');
  }
  if (signer.publicKey[0] === 3) {
      privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
      privateKey,
      tapTweakHash(toXonly(signer.publicKey), opts.tweakHash),
  );
  if (!tweakedPrivateKey) {
      throw new Error('Invalid tweaked private key!');
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
      network: opts.network,
  });
}
function tapTweakHash(pubKey, h) {
  return bitcoin.crypto.taggedHash(
      'TapTweak',
      Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}
// https://dev.to/eunovo/a-guide-to-creating-taproot-scripts-with-bitcoinjs-lib-4oph
// https://github.com/Eunovo/taproot-with-bitcoinjs

// taproot and Schnorr signature
// privacy: only reveal the necessary information
// efficiency: 

// 1. create a taproot address
const tweakedSigner = tweakSigner(keyPair1, {network: TESTNET});
const p2pktr = bitcoin.payments.p2tr({
  pubkey: toXonly(tweakedSigner.publicKey),
  network: TESTNET,
});

const { address: taprootAddress } = p2pktr;
const { address: AliceNew } = bitcoin.payments.p2wpkh({ pubkey: keyPair1.publicKey, network: TESTNET });
console.log('taprootAddress: ', taprootAddress);
let psbt = new bitcoin.Psbt({ network: TESTNET });
psbt.addInput({
  hash: '7e09ca70a9f40f3e0578bae631f65cdc5d83cb1d9345c9a76516ed99c1147805',
  index: 1,
  nonWitnessUtxo: Buffer.from('02000000000101094ebb8c7ce7499b5bb9f756e5d62bc5de430dc9169ce0c7be6fcb719e213fcb0100000000ffffffff02102700000000000022002005e22a39bb6e34d82c0ecfd6a40eec90df21cf8cb6af906ad81c78eafb1c82cc48710000000000001600141b407c3d8fe7afa5af973864193d7b5f3dfe3b0502483045022100b4068ded05c2dc5793e72a18f5320f6f465a12bb5ebf8a1614e37f6edd7752c80220692b5dee57f79127b0a7ece7fcc332fb60d7778c5111bb6fafb90c2c54324584012102860ca63eaae7cbdf7dc6861f1440decf89872fa03c8afa831ee8d75e1fd339ab00000000', 'hex')
})
psbt.addOutput({
  address: taprootAddress,
  value: 20000
}).addOutput({
  address: AliceNew,
  value: 0.00029 * 100000000 - 20000 - 500
});
psbt.signInput(0, keyPair1).finalizeAllInputs();

const rawTx = psbt.extractTransaction().toHex();
console.log('wait for being broadcasted: ', rawTx);
// https://mempool.space/testnet/tx/051ba5d59beb7a1424e6a04ba4e843fbc9dcfffdbb014e1978fc441d7db059db
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//         rawTx
//       ]
// }).then((res)=> console.log(res.data));

// spend the uxto from tweakSigner
const psbt1 = new bitcoin.Psbt({ network: TESTNET });
psbt1.addInput({
  hash: "051ba5d59beb7a1424e6a04ba4e843fbc9dcfffdbb014e1978fc441d7db059db",
  index: 0,
  witnessUtxo: {value: 0.0002*1e8, script:  p2pktr.output },
  tapInternalKey: toXonly(tweakedSigner.publicKey),
})
psbt1.addOutput({
  address: AliceNew,
  value: 10000
}).addOutput({
  address: taprootAddress,
  value: 0.0002 * 100000000 - 10000 - 500
});

psbt1.signInput(0, tweakedSigner).finalizeAllInputs();
const taprootTx = psbt1.extractTransaction().toHex();
console.log('wait for being broadcasted: ', taprootTx);
// https://mempool.space/testnet/tx/2f79cdb5dd5e3092b5b07ddea0c3c1411776d0886b1b774a9a3e6da97f617d8d
// axios.post('https://btc-testnet.nownodes.io', {
//   "API_key": "5deef046-5cd7-4f78-9c57-c71cc4937d15",
//       "jsonrpc": "2.0",
//       "id": "test",
//       "method": "sendrawtransaction",
//       "params": [
//         taprootTx
//       ]
// }).then((res)=> console.log(res.data));
const secret_bytes = Buffer.from('SECRET');
const hash = bitcoin.crypto.hash160(secret_bytes);
const hash_script_asm = `OP_HASH160 ${hash.toString('hex')} OP_EQUALVERIFY ${toXonly(keyPair1.publicKey).toString('hex')} OP_CHECKSIG`;
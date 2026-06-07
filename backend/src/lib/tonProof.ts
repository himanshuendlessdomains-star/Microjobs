import crypto from "crypto";
import nacl from "tweetnacl";
import { Address, Cell } from "@ton/ton";
import type { TonProofPayload } from "../types/index.js";

const PROOF_LIFETIME = parseInt(process.env.PROOF_LIFETIME_SECONDS ?? "300", 10);
const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS ?? "localhost")
  .split(",")
  .map((d) => d.trim());

/**
 * Verify a TonConnect v2 proof.
 *
 * The signed message is constructed as:
 *   "ton-proof-item-v2/" || workchain (4 bytes BE) || address hash (32 bytes)
 *   || domain length (4 bytes LE) || domain || timestamp (8 bytes LE) || payload
 *
 * The final hash is: SHA-256( 0xffff || "ton-connect" || SHA-256(message) )
 * The signature is an Ed25519 signature over that hash.
 */
export function verifyTonProof(payload: TonProofPayload): boolean {
  try {
    const { address, proof } = payload;

    // 1. Timestamp freshness check
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - proof.timestamp) > PROOF_LIFETIME) {
      return false;
    }

    // 2. Domain allow-list check
    if (!ALLOWED_DOMAINS.includes(proof.domain.value)) {
      return false;
    }

    // 3. Parse the TON address
    const parsedAddress = Address.parse(address);

    // 4. Build the signed message bytes
    const workchainBuf = Buffer.allocUnsafe(4);
    workchainBuf.writeInt32BE(parsedAddress.workChain);

    const domainBuf = Buffer.from(proof.domain.value, "utf8");
    const domainLenBuf = Buffer.allocUnsafe(4);
    domainLenBuf.writeUInt32LE(domainBuf.length);

    const timestampBuf = Buffer.allocUnsafe(8);
    timestampBuf.writeBigInt64LE(BigInt(proof.timestamp));

    const message = Buffer.concat([
      Buffer.from("ton-proof-item-v2/"),
      workchainBuf,
      parsedAddress.hash,
      domainLenBuf,
      domainBuf,
      timestampBuf,
      Buffer.from(proof.payload),
    ]);

    // 5. Double-hash per TonConnect spec
    const messageHash = crypto.createHash("sha256").update(message).digest();
    const finalHash = crypto
      .createHash("sha256")
      .update(Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from("ton-connect"), messageHash]))
      .digest();

    // 6. Extract public key
    const pubKey = extractPublicKey(payload);

    // 7. Verify Ed25519 signature
    const sig = Buffer.from(proof.signature, "base64");
    return nacl.sign.detached.verify(finalHash, sig, pubKey);
  } catch {
    return false;
  }
}

/**
 * Extract the 32-byte Ed25519 public key.
 * Priority: state_init (for undeployed wallets) → public_key field in payload.
 *
 * For deployed wallets where state_init is absent, the caller should have
 * fetched the public key from the TON blockchain and populated payload.public_key.
 */
function extractPublicKey(payload: TonProofPayload): Uint8Array {
  if (payload.proof.state_init) {
    return extractPubKeyFromStateInit(payload.proof.state_init);
  }
  // Fallback to the public_key sent by the wallet (verify against blockchain in prod)
  return Buffer.from(payload.public_key, "hex");
}

/**
 * Parse a WalletV3R2 / WalletV4R2 StateInit BOC and return the public key.
 * Both wallet versions store: seqno (32 bits) | subwallet_id (32 bits) | pubkey (256 bits)
 * at the start of the data cell.
 */
function extractPubKeyFromStateInit(stateInitBase64: string): Uint8Array {
  const root = Cell.fromBase64(stateInitBase64);
  const slice = root.beginParse();

  // TL-B: _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
  //          code:(Maybe ^Cell) data:(Maybe ^Cell) library:(HashmapE 256 SimpleLib)
  if (slice.loadBit()) slice.loadUint(5);  // split_depth
  if (slice.loadBit()) slice.loadUint(2);  // special (tick/tock)
  if (slice.loadBit()) slice.loadRef();    // code cell

  if (!slice.loadBit()) throw new Error("StateInit has no data cell");
  const data = slice.loadRef().beginParse();

  data.loadUint(32); // seqno
  data.loadUint(32); // subwallet_id
  return data.loadBuffer(32); // public key (32 bytes)
}

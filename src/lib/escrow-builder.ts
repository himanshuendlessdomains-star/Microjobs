// SERVER-ONLY — never import this from client components.
// All @ton/core cell construction happens here so browsers never need it.

import { beginCell, Cell, Address, Dictionary, contractAddress } from "@ton/core";
import { BOUNTY_ESCROW_CODE_HEX } from "./escrow-code";

// 0.2 TON sent with the Fund message covers pool plus gas for winner payouts.
const FUND_GAS_NANOTONS = 200_000_000n;

// 0.5 TON covers the SetWinners message gas for up to 100 winners.
const SETTLE_GAS_NANOTONS = 500_000_000n;

// 0.05 TON is enough for a Cancel message (single refund send).
const CANCEL_GAS_NANOTONS = 50_000_000n;

export function isContractReady(): boolean {
  return BOUNTY_ESCROW_CODE_HEX.length > 0;
}

function buildDataCell(
  creatorRaw: string,
  winnerCount: number,
  deadlineUnixSecs: number,
  nonce: number
): Cell {
  return beginCell()
    .storeAddress(Address.parse(creatorRaw))
    .storeUint(winnerCount, 8)
    .storeUint(deadlineUnixSecs, 48)
    .storeCoins(0n)
    .storeBit(false)
    .storeUint(BigInt(nonce), 64)
    .endCell();
}

export interface EscrowDeployTx {
  escrowAddress: string;
  stateInitBoc: string;
  fundPayloadBoc: string;
  totalNanotons: string;
}

export function buildEscrowDeployTx(
  creatorRaw: string,
  winnerCount: number,
  deadlineUnixSecs: number,
  nonce: number,
  poolNanotons: bigint
): EscrowDeployTx {
  const code = Cell.fromHex(BOUNTY_ESCROW_CODE_HEX);
  const data = buildDataCell(creatorRaw, winnerCount, deadlineUnixSecs, nonce);

  const addr = contractAddress(0, { code, data });
  const escrowAddress = addr.toString({ bounceable: false });

  // StateInit cell — deploys the contract on first message
  const stateInitCell = beginCell()
    .storeBit(false)
    .storeBit(false)
    .storeBit(true)
    .storeRef(code)
    .storeBit(true)
    .storeRef(data)
    .storeBit(false)
    .endCell();

  const stateInitBoc = stateInitCell.toBoc().toString("base64");

  // Fund message body — explicit pool amount so the contract records it exactly
  const fundPayloadBoc = beginCell()
    .storeUint(0x7b7f2a2f, 32)
    .storeCoins(poolNanotons)
    .endCell()
    .toBoc()
    .toString("base64");

  return {
    escrowAddress,
    stateInitBoc,
    fundPayloadBoc,
    totalNanotons: (poolNanotons + FUND_GAS_NANOTONS).toString(),
  };
}

export interface EscrowSettleTx {
  payloadBoc: string;
  gasNanotons: string;
}

export function buildSetWinnersTx(winnerRawAddrs: string[]): EscrowSettleTx {
  const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Address());
  winnerRawAddrs.forEach((addr, i) => {
    dict.set(i, Address.parse(addr));
  });

  const payloadBoc = beginCell()
    .storeUint(0x3e4a9d8c, 32)
    .storeDict(dict)
    .storeUint(winnerRawAddrs.length, 8)
    .endCell()
    .toBoc()
    .toString("base64");

  return {
    payloadBoc,
    gasNanotons: SETTLE_GAS_NANOTONS.toString(),
  };
}

export function buildCancelTx(): EscrowSettleTx {
  const payloadBoc = beginCell()
    .storeUint(0xf1c3a5b7, 32)
    .endCell()
    .toBoc()
    .toString("base64");

  return {
    payloadBoc,
    gasNanotons: CANCEL_GAS_NANOTONS.toString(),
  };
}

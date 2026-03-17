import { ethers } from "ethers";

const DOMAIN_NAME = "SmeltProtocol";
const DOMAIN_VERSION = "1";

const RECEIPT_TYPE = {
  SmeltReceipt: [
    { name: "miner",      type: "address" },
    { name: "epochId",    type: "uint256" },
    { name: "siteId",     type: "bytes32" },
    { name: "challengeId",type: "bytes32" },
    { name: "credits",    type: "uint256" },
    { name: "solveIndex", type: "uint256" },
    { name: "nonce",      type: "bytes32" },
  ],
};

export interface ReceiptPayload {
  miner: string;
  epochId: number;
  siteId: string;
  challengeId: string;
  credits: number;
  solveIndex: number;
  nonce: string;
}

let _signer: ethers.Wallet | null = null;

function getSigner(): ethers.Wallet {
  if (!_signer) {
    if (!process.env.COORDINATOR_PRIVATE_KEY) {
      throw new Error("COORDINATOR_PRIVATE_KEY not set");
    }
    _signer = new ethers.Wallet(process.env.COORDINATOR_PRIVATE_KEY);
  }
  return _signer;
}

export function getCoordinatorAddress(): string {
  return getSigner().address;
}

export async function signReceipt(payload: ReceiptPayload, chainId: number): Promise<string> {
  const signer = getSigner();

  const domain = {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chainId,
    verifyingContract: process.env.SETTLEMENT_CONTRACT_ADDRESS as string,
  };

  const value = {
    miner:       payload.miner,
    epochId:     payload.epochId,
    siteId:      ethers.encodeBytes32String(payload.siteId.slice(0, 31)),
    challengeId: ethers.encodeBytes32String(payload.challengeId.slice(0, 31)),
    credits:     payload.credits,
    solveIndex:  payload.solveIndex,
    nonce:       ethers.encodeBytes32String(payload.nonce.slice(0, 31)),
  };

  const signature = await signer.signTypedData(domain, RECEIPT_TYPE, value);
  return signature;
}

export function encodeReceiptCalldata(
  payload: ReceiptPayload,
  signature: string
): string {
  const iface = new ethers.Interface([
    "function submitReceipt(address miner, uint256 epochId, bytes32 siteId, bytes32 challengeId, uint256 credits, uint256 solveIndex, bytes32 nonce, bytes signature)",
  ]);

  return iface.encodeFunctionData("submitReceipt", [
    payload.miner,
    payload.epochId,
    ethers.encodeBytes32String(payload.siteId.slice(0, 31)),
    ethers.encodeBytes32String(payload.challengeId.slice(0, 31)),
    payload.credits,
    payload.solveIndex,
    ethers.encodeBytes32String(payload.nonce.slice(0, 31)),
    signature,
  ]);
}

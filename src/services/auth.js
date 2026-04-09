import { ethers } from "ethers";

export const AMOY_CHAIN = {
  chainId: 80002,
  name: "Polygon Amoy",
  currency: "MATIC",
  explorerBaseUrl: "https://amoy.polygonscan.com",
};

export function normalizeWalletAddress(address = "") {
  return address.trim().toLowerCase();
}

export function isWalletAddress(address = "") {
  return ethers.isAddress(address);
}

export function shortenWalletAddress(address = "", leading = 6, trailing = 4) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, leading)}...${address.slice(-trailing)}`;
}

export function getAddressExplorerUrl(address) {
  return `${AMOY_CHAIN.explorerBaseUrl}/address/${address}`;
}

export function getTransactionExplorerUrl(txHash) {
  return `${AMOY_CHAIN.explorerBaseUrl}/tx/${txHash}`;
}

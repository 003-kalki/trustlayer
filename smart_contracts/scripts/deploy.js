const { ethers } = require("ethers");
const compiled = require("../test/compile");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function main() {
  const rpcUrl = "https://rpc-amoy.polygon.technology/";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let rawKey = process.env.PRIVATE_KEY;
  if (!rawKey) {
      throw new Error("PRIVATE_KEY is not set. Add the deployer key to .env.local in the project root.");
  }
  // Strip extraneous quotes if they exist from dotenv parsing
  rawKey = rawKey.replace(/^"|'|"$|'/g, '');

  if (!rawKey.startsWith("0x")) rawKey = "0x" + rawKey;

  const wallet = new ethers.Wallet(rawKey, provider);
  console.log("Deploying TrustLayer Escrow with account:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Account MATIC balance:", ethers.formatEther(balance));

  if (balance === 0n) {
      throw new Error("CRITICAL: Insufficient MATIC for deployment. Please grab some from https://faucet.polygon.technology/");
  }

  console.log("\nInitiating Amoy deployment transaction...");
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ TrustLayer Escrow successfully deployed!");
  console.log("Network: Polygon Amoy Testnet");
  console.log("Contract Address:", contractAddress);
  console.log("Block:", await provider.getBlockNumber());
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

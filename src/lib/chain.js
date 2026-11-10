import { ethers } from "ethers";
import abi from "./TrustLayerABI.json";

const RPC_URL = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

let readOnlyContract;

function getContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
  }
  if (!readOnlyContract) {
    readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, abi, new ethers.JsonRpcProvider(RPC_URL));
  }
  return readOnlyContract;
}

// Reads an escrow job from the deployed contract. Retries briefly because public RPC nodes
// can lag a block or two behind the node that just confirmed the creating transaction.
export async function getOnChainJob(jobId, attempts = 3) {
  const contract = getContract();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const job = await contract.jobs(BigInt(jobId));
    if (job.employer !== ethers.ZeroAddress) {
      return {
        employer: job.employer.toLowerCase(),
        freelancer: job.freelancer.toLowerCase(),
        totalAmountMatic: ethers.formatEther(job.totalAmount),
        status: Number(job.status),
      };
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return null;
}

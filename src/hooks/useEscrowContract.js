import { useState } from 'react';
import { useWeb3Auth } from '../components/AuthProvider';
import { ethers } from 'ethers';
import abi from '../lib/TrustLayerABI.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export function useEscrowContract() {
    const { ethersProvider } = useWeb3Auth();
    const [isTxLoading, setIsTxLoading] = useState(false);
    const [txError, setTxError] = useState(null);

    const getContract = async () => {
        if (!ethersProvider) throw new Error("Wallet not connected! Please log in via Google.");
        if (!CONTRACT_ADDRESS) throw new Error("Contract Address missing in environment!");
        const signer = await ethersProvider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    };

    const createEscrowJob = async (freelancerAddress, totalAmountMatic) => {
        setIsTxLoading(true);
        setTxError(null);
        try {
            const contract = await getContract();
            
            // Convert MATIC strings (e.g., "1.5") to 18-decimal integer Wei representations
            const totalAmountWei = ethers.parseEther(totalAmountMatic.toString());
            
            // The Escrow logic geometrically requires exactly 50% sent upfront 
            const depositWei = totalAmountWei / 2n;

            console.log("Preparing Create transaction...", { freelancerAddress, depositWei });
            const tx = await contract.createJob(freelancerAddress, totalAmountWei, {
                value: depositWei
            });
            console.log("Tx Broadcasted:", tx.hash);
            const receipt = await tx.wait(); // Pause thread state for block confirmation
            console.log("Tx Settled:", receipt);

            // Extract the generated JobID natively from the Blockchain mathematical Event Logs
            let generatedJobId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
                    if (parsed && parsed.name === "JobCreated") {
                        generatedJobId = parsed.args.jobId.toString();
                        break;
                    }
                } catch(e) { } // Ignore random unknown logs
            }

            return { success: true, hash: tx.hash, jobId: generatedJobId };
        } catch (err) {
            console.error(err);
            setTxError(err.message || "Failed to initialize Escrow");
            return { success: false, error: err };
        } finally {
            setIsTxLoading(false);
        }
    };

    const completeEscrowJob = async (jobId, totalAmountMatic) => {
        setIsTxLoading(true);
        setTxError(null);
        try {
            const contract = await getContract();
            
            const totalAmountWei = ethers.parseEther(totalAmountMatic.toString());
            
            // The exact remaining 50% must be sent on completion
            const remainingWei = totalAmountWei / 2n;

            console.log(`Releasing funds to Job ID: ${jobId}...`);
            const tx = await contract.completeJob(jobId, {
                value: remainingWei
            });
            
            const receipt = await tx.wait();
            console.log("Tx Settled:", receipt);
            return { success: true, hash: tx.hash };
        } catch (err) {
            console.error(err);
            setTxError(err.message || "Failed to release Escrow funds");
            return { success: false, error: err };
        } finally {
            setIsTxLoading(false);
        }
    };

    const getUserJobs = async (userAddress) => {
        try {
            const contract = await getContract();
            const counter = await contract.jobCounter();
            
            const fetchedJobs = [];
            // Blockchain maps are 1-indexed natively here
            for (let i = 1n; i <= counter; i++) {
                const job = await contract.jobs(i);
                
                if (job.employer.toLowerCase() === userAddress.toLowerCase() || 
                    job.freelancer.toLowerCase() === userAddress.toLowerCase()) {
                    
                    fetchedJobs.push({
                        id: job.id.toString(),
                        employer: job.employer,
                        freelancer: job.freelancer,
                        totalAmountMatic: ethers.formatEther(job.totalAmount),
                        depositedAmountMatic: ethers.formatEther(job.depositedAmount),
                        status: Number(job.status), // 0: DRAFT, 1: ACTIVE, 2: COMPLETED, 3: DISPUTED
                        isEmployer: job.employer.toLowerCase() === userAddress.toLowerCase()
                    });
                }
            }
            return fetchedJobs.reverse(); // Newest jobs at the top
        } catch (err) {
            console.error("Failed fetching jobs from ledger:", err);
            return [];
        }
    };

    return { 
        createEscrowJob, 
        completeEscrowJob, 
        getUserJobs,
        isTxLoading, 
        txError 
    };
}

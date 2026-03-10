// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustLayer Escrow Service
 * @dev Manages 50/50 milestone agreements between Employers and Freelancers.
 */
contract TrustLayer {
    
    enum JobStatus { DRAFT, ACTIVE, COMPLETED, DISPUTED }

    struct Job {
        uint256 id;
        address employer;
        address freelancer;
        uint256 totalAmount;
        uint256 depositedAmount;
        JobStatus status;
    }

    uint256 public jobCounter;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed employer, address indexed freelancer, uint256 initialDeposit);
    event JobCompleted(uint256 indexed jobId, address indexed employer, address indexed freelancer, uint256 finalPayout);

    error InvalidDepositAmount();
    error NotEmployer();
    error JobNotActive();
    error TransferFailed();

    /**
     * @dev Employer initiates a job by depositing the first 50% milestone.
     */
    function createJob(address _freelancer, uint256 _totalAmount) external payable {
        // Require exactly 50% of the total amount upfront
        if (msg.value != _totalAmount / 2) {
            revert InvalidDepositAmount();
        }

        jobCounter++;
        
        jobs[jobCounter] = Job({
            id: jobCounter,
            employer: msg.sender,
            freelancer: _freelancer,
            totalAmount: _totalAmount,
            depositedAmount: msg.value,
            status: JobStatus.ACTIVE
        });

        emit JobCreated(jobCounter, msg.sender, _freelancer, msg.value);
    }

    /**
     * @dev Employer deposits the remaining 50% and releases the full 100% to the freelancer.
     */
    function completeJob(uint256 _jobId) external payable {
        Job storage job = jobs[_jobId];

        if (msg.sender != job.employer) {
            revert NotEmployer();
        }
        if (job.status != JobStatus.ACTIVE) {
            revert JobNotActive();
        }
        
        // Require the remaining 50%
        uint256 remainingBalance = job.totalAmount - job.depositedAmount;
        if (msg.value != remainingBalance) {
            revert InvalidDepositAmount();
        }

        // Update state to completed
        job.depositedAmount += msg.value;
        job.status = JobStatus.COMPLETED;

        // Transfer 100% to the freelancer
        (bool success, ) = payable(job.freelancer).call{value: job.totalAmount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit JobCompleted(_jobId, job.employer, job.freelancer, job.totalAmount);
    }
}

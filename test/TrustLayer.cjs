const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustLayer Escrow", function () {
  let trustlayer;
  let owner;
  let employer;
  let freelancer;

  beforeEach(async function () {
    [owner, employer, freelancer] = await ethers.getSigners();
    const TrustLayer = await ethers.getContractFactory("TrustLayer");
    trustlayer = await TrustLayer.deploy();
  });

  it("Should create a new 50/50 escrow job", async function () {
    const totalAmount = ethers.parseEther("1.0"); // 1 MATIC
    const halfAmount = ethers.parseEther("0.5");  // 0.5 MATIC

    // Employer creates job by depositing 0.5 MATIC
    await expect(
      trustlayer.connect(employer).createJob(freelancer.address, totalAmount, { value: halfAmount })
    ).to.emit(trustlayer, "JobCreated")
     .withArgs(1, employer.address, freelancer.address, halfAmount);

    const job = await trustlayer.jobs(1);
    expect(job.employer).to.equal(employer.address);
    expect(job.freelancer).to.equal(freelancer.address);
    expect(job.totalAmount).to.equal(totalAmount);
    expect(job.depositedAmount).to.equal(halfAmount);
    expect(job.status).to.equal(1); // ACTIVE
  });

  it("Should fail to create a job if deposit is not exactly 50%", async function () {
    const totalAmount = ethers.parseEther("1.0");
    const wrongAmount = ethers.parseEther("0.4");
    
    await expect(
      trustlayer.connect(employer).createJob(freelancer.address, totalAmount, { value: wrongAmount })
    ).to.be.revertedWithCustomError(trustlayer, "InvalidDepositAmount");
  });

  it("Should complete the job and release 100% of funds to freelancer", async function () {
    const totalAmount = ethers.parseEther("2.0");
    const halfAmount = ethers.parseEther("1.0");

    await trustlayer.connect(employer).createJob(freelancer.address, totalAmount, { value: halfAmount });

    const initialFreelancerBalance = await ethers.provider.getBalance(freelancer.address);

    // Employer completes the job by depositing the remaining 1.0 MATIC
    await expect(
      trustlayer.connect(employer).completeJob(1, { value: halfAmount })
    ).to.emit(trustlayer, "JobCompleted")
     .withArgs(1, employer.address, freelancer.address, totalAmount);

    const job = await trustlayer.jobs(1);
    expect(job.status).to.equal(2); // COMPLETED

    // Check that freelancer received the full 2.0 MATIC 
    const finalFreelancerBalance = await ethers.provider.getBalance(freelancer.address);
    // 2.0 MATIC
    expect(finalFreelancerBalance - initialFreelancerBalance).to.equal(totalAmount);
  });
});

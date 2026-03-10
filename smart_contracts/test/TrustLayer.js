const { expect } = require("chai");
const { ethers } = require("ethers");
const ganache = require("ganache");
const compiled = require("./compile");

describe("TrustLayer Escrow", function () {
  let trustlayer;
  let owner;
  let employer;
  let freelancer;
  let provider;

  beforeEach(async function () {
    // Spin up an isolated blockchain instance
    provider = new ethers.BrowserProvider(ganache.provider());
    const signers = await provider.listAccounts();
    owner = await provider.getSigner(signers[0].address);
    employer = await provider.getSigner(signers[1].address);
    freelancer = await provider.getSigner(signers[2].address);

    const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, owner);
    trustlayer = await factory.deploy();
    await trustlayer.waitForDeployment();
  });

  it("Should create a new 50/50 escrow job", async function () {
    const totalAmount = ethers.parseEther("1.0"); // 1 MATIC
    const halfAmount = ethers.parseEther("0.5");  // 0.5 MATIC

    // Note: Ethers v6 requires explicitly waiting for transactions
    const tx = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), totalAmount, { value: halfAmount });
    await tx.wait();

    const job = await trustlayer.jobs(1n);
    expect(job.employer).to.equal(await employer.getAddress());
    expect(job.freelancer).to.equal(await freelancer.getAddress());
    expect(job.totalAmount).to.equal(totalAmount);
    expect(job.depositedAmount).to.equal(halfAmount);
    expect(job.status).to.equal(1n); // ACTIVE
  });

  it("Should fail to create a job if deposit is not exactly 50%", async function () {
    const totalAmount = ethers.parseEther("1.0");
    const wrongAmount = ethers.parseEther("0.4");
    
    let failed = false;
    try {
      const tx = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), totalAmount, { value: wrongAmount });
      await tx.wait();
    } catch (error) {
      failed = true;
      expect(error.message).to.include("revert");
    }
    expect(failed).to.be.true;
  });

  it("Should complete the job and release 100% of funds to freelancer", async function () {
    const totalAmount = ethers.parseEther("2.0");
    const halfAmount = ethers.parseEther("1.0");
    const fAddress = await freelancer.getAddress();

    const tx1 = await trustlayer.connect(employer).createJob(fAddress, totalAmount, { value: halfAmount });
    await tx1.wait();

    const initialFreelancerBalance = await provider.getBalance(fAddress);

    // Employer completes the job by depositing the remaining 1.0 MATIC
    const tx2 = await trustlayer.connect(employer).completeJob(1n, { value: halfAmount });
    await tx2.wait();

    const job = await trustlayer.jobs(1n);
    expect(job.status).to.equal(2n); // COMPLETED

    // Check that freelancer received the full 2.0 MATIC 
    const finalFreelancerBalance = await provider.getBalance(fAddress);
    expect(finalFreelancerBalance - initialFreelancerBalance).to.equal(totalAmount);
  });
});

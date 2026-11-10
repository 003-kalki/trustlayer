const { expect } = require("chai");
const { ethers } = require("ethers");
const ganache = require("ganache");
const compiled = require("./compile");

describe("TrustLayer Escrow", function () {
  let trustlayer;
  let owner;
  let employer;
  let freelancer;
  let stranger;
  let provider;

  // Read balances straight from the node so ethers' request caching can't return a stale value.
  async function balanceOf(address) {
    return BigInt(await provider.send("eth_getBalance", [address, "latest"]));
  }

  async function expectRevert(promise, errorName) {
    let failed = false;
    try {
      const tx = await promise;
      await tx?.wait?.();
    } catch (error) {
      failed = true;
      // Ganache returns the custom error selector in error.info.error.data.result
      const revertData = error.data || error.info?.error?.data?.result;
      expect(revertData, error.message).to.be.a("string");
      expect(trustlayer.interface.parseError(revertData)?.name).to.equal(errorName);
    }
    expect(failed, `expected revert ${errorName}`).to.be.true;
  }

  beforeEach(async function () {
    // Spin up an isolated blockchain instance
    provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true } }));
    const signers = await provider.listAccounts();
    owner = await provider.getSigner(signers[0].address);
    employer = await provider.getSigner(signers[1].address);
    freelancer = await provider.getSigner(signers[2].address);
    stranger = await provider.getSigner(signers[3].address);

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

    await expectRevert(
      trustlayer.connect(employer).createJob(await freelancer.getAddress(), totalAmount, { value: wrongAmount }),
      "InvalidDepositAmount"
    );
  });

  it("Should reject a zero-value job", async function () {
    await expectRevert(
      trustlayer.connect(employer).createJob(await freelancer.getAddress(), 0n, { value: 0n }),
      "InvalidDepositAmount"
    );
  });

  it("Should reject the zero address or the employer as freelancer", async function () {
    const totalAmount = ethers.parseEther("1.0");
    const halfAmount = ethers.parseEther("0.5");

    await expectRevert(
      trustlayer.connect(employer).createJob(ethers.ZeroAddress, totalAmount, { value: halfAmount }),
      "InvalidFreelancer"
    );
    await expectRevert(
      trustlayer.connect(employer).createJob(await employer.getAddress(), totalAmount, { value: halfAmount }),
      "InvalidFreelancer"
    );
  });

  it("Should complete the job and release 100% of funds to freelancer", async function () {
    const totalAmount = ethers.parseEther("2.0");
    const halfAmount = ethers.parseEther("1.0");
    const fAddress = await freelancer.getAddress();

    const tx1 = await trustlayer.connect(employer).createJob(fAddress, totalAmount, { value: halfAmount });
    await tx1.wait();

    const initialFreelancerBalance = await balanceOf(fAddress);

    // Employer completes the job by depositing the remaining 1.0 MATIC
    const tx2 = await trustlayer.connect(employer).completeJob(1n, { value: halfAmount });
    await tx2.wait();

    const job = await trustlayer.jobs(1n);
    expect(job.status).to.equal(2n); // COMPLETED

    // Check that freelancer received the full 2.0 MATIC
    const finalFreelancerBalance = await balanceOf(fAddress);
    expect(finalFreelancerBalance - initialFreelancerBalance).to.equal(totalAmount);
    expect(await balanceOf(await trustlayer.getAddress())).to.equal(0n);
  });

  it("Should complete a job with an odd wei total", async function () {
    const totalAmount = 3n;
    const tx1 = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), totalAmount, { value: 1n });
    await tx1.wait();

    // The second milestone covers the rounding remainder
    const tx2 = await trustlayer.connect(employer).completeJob(1n, { value: 2n });
    await tx2.wait();

    expect((await trustlayer.jobs(1n)).status).to.equal(2n);
  });

  it("Should only let the employer complete a job", async function () {
    const halfAmount = ethers.parseEther("0.5");
    const tx = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), halfAmount * 2n, { value: halfAmount });
    await tx.wait();

    await expectRevert(trustlayer.connect(stranger).completeJob(1n, { value: halfAmount }), "NotEmployer");
  });

  it("Should refund the employer when the freelancer withdraws", async function () {
    const totalAmount = ethers.parseEther("2.0");
    const halfAmount = ethers.parseEther("1.0");
    const eAddress = await employer.getAddress();

    const tx1 = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), totalAmount, { value: halfAmount });
    await tx1.wait();

    const initialEmployerBalance = await balanceOf(eAddress);

    const tx2 = await trustlayer.connect(freelancer).refundJob(1n);
    await tx2.wait();

    const job = await trustlayer.jobs(1n);
    expect(job.status).to.equal(4n); // REFUNDED
    expect(job.depositedAmount).to.equal(0n);
    expect((await balanceOf(eAddress)) - initialEmployerBalance).to.equal(halfAmount);
    expect(await balanceOf(await trustlayer.getAddress())).to.equal(0n);

    // A refunded job can no longer be completed or refunded again
    // staticCall surfaces the revert data directly from eth_call
    await expectRevert(trustlayer.connect(employer).completeJob.staticCall(1n, { value: halfAmount }), "JobNotActive");
    await expectRevert(trustlayer.connect(freelancer).refundJob.staticCall(1n), "JobNotActive");
  });

  it("Should not let the employer or a stranger trigger a refund", async function () {
    const halfAmount = ethers.parseEther("0.5");
    const tx = await trustlayer.connect(employer).createJob(await freelancer.getAddress(), halfAmount * 2n, { value: halfAmount });
    await tx.wait();

    await expectRevert(trustlayer.connect(employer).refundJob(1n), "NotFreelancer");
    await expectRevert(trustlayer.connect(stranger).refundJob(1n), "NotFreelancer");
  });
});

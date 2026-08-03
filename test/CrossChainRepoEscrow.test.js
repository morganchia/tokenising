const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// These tests exercise the escrow contract in isolation on a single Hardhat network,
// standing in for "one chain". Cross-chain coordination itself is the relayer's job
// (server/app/relayer/crossChainRepoRelayer.js) and isn't covered here — this just
// verifies the on-chain guarantees the relayer depends on: lock/release/refund and
// the 2-of-3 confirmation threshold.
describe("CrossChainRepoEscrow", function () {
  const LOCKED = 1;
  const RELEASED = 2;
  const REFUNDED = 3;

  async function deployFixture() {
    const [owner, depositor, beneficiary, relayer1, relayer2, relayer3, stranger] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20TokenDSGD");
    const token = await upgrades.deployProxy(
      Token,
      ["Test Token", "TST", ethers.parseEther("1000000")],
      { kind: "uups" }
    );
    await token.waitForDeployment();
    await token.mint(depositor.address, ethers.parseEther("1000"));

    const Escrow = await ethers.getContractFactory("CrossChainRepoEscrow");
    const escrow = await upgrades.deployProxy(
      Escrow,
      [[relayer1.address, relayer2.address, relayer3.address], 2],
      { kind: "uups" }
    );
    await escrow.waitForDeployment();

    return { owner, depositor, beneficiary, relayer1, relayer2, relayer3, stranger, token, escrow };
  }

  function legId(n) {
    return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [n]));
  }

  async function futureDeadline(seconds = 3600) {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + seconds;
  }

  it("locks tokens from the depositor into escrow", async function () {
    const { depositor, beneficiary, escrow, token } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);

    const deadline = await futureDeadline();
    await escrow.lock(legId(1), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    const leg = await escrow.getLeg(legId(1));
    expect(leg.status).to.equal(LOCKED);
    expect(leg.amount).to.equal(amount);
    expect(await token.balanceOf(await escrow.getAddress())).to.equal(amount);
  });

  it("does not release after only 1-of-3 confirmations", async function () {
    const { depositor, beneficiary, escrow, token, relayer1 } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline();
    await escrow.lock(legId(2), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    await escrow.connect(relayer1).confirmRelease(legId(2));

    const leg = await escrow.getLeg(legId(2));
    expect(leg.status).to.equal(LOCKED);
    expect(leg.confirmCount).to.equal(1);
    expect(await token.balanceOf(beneficiary.address)).to.equal(0);
  });

  it("releases to the beneficiary after 2-of-3 confirmations", async function () {
    const { depositor, beneficiary, escrow, token, relayer1, relayer2 } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline();
    await escrow.lock(legId(3), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    await escrow.connect(relayer1).confirmRelease(legId(3));
    await escrow.connect(relayer2).confirmRelease(legId(3));

    const leg = await escrow.getLeg(legId(3));
    expect(leg.status).to.equal(RELEASED);
    expect(await token.balanceOf(beneficiary.address)).to.equal(amount);
  });

  it("rejects confirmation from an unregistered relayer", async function () {
    const { depositor, beneficiary, escrow, token, stranger } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline();
    await escrow.lock(legId(4), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    await expect(escrow.connect(stranger).confirmRelease(legId(4))).to.be.revertedWith(
      "Only a registered relayer can call this function"
    );
  });

  it("rejects a relayer confirming the same leg twice", async function () {
    const { depositor, beneficiary, escrow, token, relayer1 } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline();
    await escrow.lock(legId(5), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    await escrow.connect(relayer1).confirmRelease(legId(5));
    await expect(escrow.connect(relayer1).confirmRelease(legId(5))).to.be.revertedWith(
      "Already confirmed by this relayer"
    );
  });

  it("refunds the depositor after the deadline if never released", async function () {
    const { depositor, beneficiary, escrow, token } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline(60);
    await escrow.lock(legId(6), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline);

    await expect(escrow.connect(depositor).refund(legId(6))).to.be.revertedWith("Deadline not yet passed");

    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    const balanceBefore = await token.balanceOf(depositor.address);
    await escrow.connect(depositor).refund(legId(6));
    const balanceAfter = await token.balanceOf(depositor.address);

    expect(balanceAfter - balanceBefore).to.equal(amount);
    const leg = await escrow.getLeg(legId(6));
    expect(leg.status).to.equal(REFUNDED);
  });

  it("rejects lock() from a non-admin caller", async function () {
    const { depositor, beneficiary, escrow, token, stranger } = await deployFixture();
    const amount = ethers.parseEther("100");
    await token.connect(depositor).approve(await escrow.getAddress(), amount);
    const deadline = await futureDeadline();

    await expect(
      escrow.connect(stranger).lock(legId(7), await token.getAddress(), depositor.address, beneficiary.address, amount, deadline)
    ).to.be.revertedWith("Only owner or admin can call this function");
  });
});

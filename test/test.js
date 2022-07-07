const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Swap", function () {
  let tokenA, tokenB, swap;

  beforeEach("Setting up accounts and stuff", async function () {
    // getting signers
    [this.admin, this.alice, this.bob, this.carol] =
      await hre.ethers.getSigners();

    // deploying Token A
    tokenA = await ethers.getContractFactory("TestToken");
    tokenA = await upgrades.deployProxy(tokenA, ["TokenA", "TKNA"]);
    // deploying Token B
    tokenB = await ethers.getContractFactory("TestToken");
    tokenB = await upgrades.deployProxy(tokenB, ["TokenB", "TKNB"]);

    // deploying Swap contract
    const Swap = await ethers.getContractFactory("Swap");
    swap = await upgrades.deployProxy(
      Swap,
      [
        tokenA.address,
        tokenB.address,
        this.admin.address,
        this.admin.address,
        this.admin.address,
        "Com-dex",
        123,
        180,
      ],
      {
        initializer:
          "initialize(address,address,address,address,address,string,uint,uint)",
      }
    );
    await swap.deployed();
  });

  it("Should deploy token A and token B with assign correct supply to admin", async function () {
    // const swap = await upgrades.deployProxy(Swap,[this.admin.address,this.])
    const balanceA = await tokenA.balanceOf(this.admin.address);
    const balanceB = await tokenB.balanceOf(this.admin.address);
    // const n = BigNumber.from(8 * 10 ** 8 * 10 ** 18);
    // const a = BigNumber.from(n).mul(1);
    // console.log(n);
    expect(balanceA).to.be.equal(ethers.utils.parseEther("800000000", 18));
    expect(balanceB).to.be.equal(ethers.utils.parseEther("800000000", 18));
  });

  it("Should Deploy Swap contract and initialize correclty", async function () {
    const dexName = await swap.commDexName();
    // console.log(dexName,"This is dexName");
  });
});

const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Swap", function () {
  let tokenA, tokenB, swap;

  beforeEach("Setting up accounts and stuff", async function () {
    // getting signers
    [this.admin, this.alice, this.bob, this.carol] =
      await hre.ethers.getSigners();
    console.log('Owner wallet:', this.admin.address);
    // deploying Token A
    tokenA = await ethers.getContractFactory("TestToken");
    tokenA = await upgrades.deployProxy(tokenA, ["TokenA", "TKNA"]);
    // deploying Token B
    console.log('TokenA:', tokenA.address);

    tokenB = await ethers.getContractFactory("TestToken");
    tokenB = await upgrades.deployProxy(tokenB, ["TokenB", "TKNB"]);
    await tokenA.deployed()
    await tokenB.deployed()
    
    console.log('TokenB',tokenB.address)

    const swapFactory = await ethers.getContractFactory("SwapFactory");
    this.deployedSwapFactory = await swapFactory.deploy();
    this.deployedSwapFactory.deployed();


    // deploying Swap contract
    const createSwap = await this.deployedSwapFactory.createSwap(
      tokenA.address,
      tokenB.address,
      this.admin.address,
      '0x01be23585060835e02b77ef475b0cc51aa1e0709',
      '0xf3fbb7f3391f62c8fe53f89b41dfc8159ee9653f',
      "Com-dex",
      123,
      180,
    );
    await createSwap.wait();
    let currentSwaps = await this.deployedSwapFactory.getSwaps();
    console.log("Swap Created:", currentSwaps[0])
    
    //const swap = await ethers.getContractFactory("Swap");
    this.swapContract = await ethers.getContractAt("Swap",currentSwaps[0],this.admin)
    // swap = await upgrades.deployProxy(
    //   Swap,
    //   [
    //     tokenA.address,
    //     tokenB.address,
    //     this.admin.address,
    //     this.admin.address,
    //     this.admin.address,
    //     "Com-dex",
    //     123,
    //     180,
    //   ],
    //   {
    //     initializer:
    //       "initialize(address,address,address,address,address,string,uint,uint)",
    //   }
    // );
    // await swap.deployed();
  });

  it("Should deploy token A and token B with assign correct supply to admin", async function () {
    // const swap = await upgrades.deployProxy(Swap,[this.admin.address,this.])
    const balanceA = await tokenA.balanceOf(this.admin.address);
    const balanceB = await tokenB.balanceOf(this.admin.address);
    
    expect(balanceA).to.be.equal(ethers.utils.parseEther("800000000", 18));
    expect(balanceB).to.be.equal(ethers.utils.parseEther("800000000", 18));
  });

  // it("Should Deploy Swap contract and initialize correclty", async function () {
  //  // console.log(this.swapContract);
  //   const dexName = await this.swapContract.tokenA();
  //   //expect(dexName).to.be.equal('Com-dex')
  //    console.log(dexName,"This is dexName");
  // });
});

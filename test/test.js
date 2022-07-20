const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
const fs = require("fs");
const path = require("path");
const { parseEther } = require("ethers/lib/utils");
const network = hre.hardhatArguments.network;

describe("Swap", function () {
  let tokenA, tokenB, swap, swapFactory, newDex, dexAddresses;

  beforeEach("Setting up accounts and stuff", async function () {
    this.timeout(1000000);
    // getting signers
    [this.admin, this.alice, this.bob, this.carol] =
      await hre.ethers.getSigners();

    const tokenA = await ethers.getContractFactory("TestToken");

    const tokenB = await ethers.getContractFactory("TestToken");

    const swapFactory = await ethers.getContractFactory("SwapFactory");

    const swap = await ethers.getContractFactory("Swap");

    const contractAddresses = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../../config.json"), "utf8")
    );

    this.chainId = await this.admin.getChainId();
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      //deploying token A
      this.deployedTokenA = await upgrades.deployProxy(tokenA, [
        "TokenA",
        "TKNA",
      ]);
      await this.deployedTokenA.deployed();
      //deploying token B
      this.deployedTokenB = await upgrades.deployProxy(tokenB, [
        "TokenB",
        "TKNB",
      ]);
      await this.deployedTokenB.deployed();
      //deploying SwapFactory
      this.deployedSwapFactory = await swapFactory.deploy();
      await this.deployedSwapFactory.deployed();
    } else {
      this.deployedTokenA = await hre.ethers.getContractAt(
        "TestToken",
        contractAddresses[network].tokenA
      );
      this.deployedTokenB = await hre.ethers.getContractAt(
        "TestToken",
        contractAddresses[network].tokenB
      );
      this.deployedSwapFactory = await hre.ethers.getContractAt(
        "SwapFactory",
        contractAddresses[network].SwapFactory
      );
    }

    // newDex = dexAddresses[0];
    // console.log("Swap Created:", currentSwaps[0])

    //const swap = await ethers.getContractFactory("Swap");
    // this.swapContract = await ethers.getContractAt("Swap",currentSwaps[0],this.admin)
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

  it("Should Deploy Swap contract from Factory and initialize correclty", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      // deploying Swap contract from factory
      const createSwap = await this.deployedSwapFactory.createSwap(
        this.deployedTokenA.address,
        this.deployedTokenB.address,
        this.admin.address,
        "0x01be23585060835e02b77ef475b0cc51aa1e0709",
        "0xf3fbb7f3391f62c8fe53f89b41dfc8159ee9653f",
        "Com-dex",
        10000,
        180
      );
      await createSwap.wait();
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);

      // checking if deployed
      expect(dexAddresses.length).to.be.equal(1);

      expect(await newDex.commDexName()).to.be.equal("Com-dex");
      expect(await newDex.tradeFee()).to.be.equal(10000);
      expect(await newDex.tokenA()).to.be.equal(this.deployedTokenA.address);
      expect(await newDex.tokenB()).to.be.equal(this.deployedTokenB.address);
      expect(await newDex.verifiedNode()).to.be.equal(this.admin.address);
      expect(await newDex.rateTimeOut()).to.be.equal(180);
    }
  });

  it("Should requestVoulumeData", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      // console.log(dexAddresses[0],"this is deplyedSwap from factory");
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      const rate = await newDex.getRate();
      console.log(rate, "this is old rate");
      let txResponse = await newDex.requestVolumeData(0);
      await txResponse.wait();
      await new Promise((resolve) => setTimeout(resolve, 40000));
      const newRate = await newDex.getRate();
      console.log(newRate, "this is new rate");
    }
  });

  it("Should be able to add liquidity", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);

      let reserveA = await newDex.reserveA();
      let reserveB = await newDex.reserveB();
      const rate = await newDex.getRate();

      console.log(reserveA, "reserveA");
      console.log(reserveB, "reserveB");
      console.log(rate, "rate");

      const amountA = parseEther("2", 18);
      const base = ethers.utils.parseUnits("1", 8);
      // TODO: 
      console.log(base,"this is base");
      // const amountB = (amountA * rate) / base;
      const amountB = BigNumber.from(amountA).mul(rate).div(base);
      console.log(amountA,"A");
      console.log(amountB,"B");
      // console.log(res, "this is result");

      let tx = await newDex.addLiquidity(
        amountA,
       amountB
      );
      await tx.wait();
      let newreserveA = await newDex.reserveA();
      let newreserveB = await newDex.reserveB();
      const newrate = await newDex.getRate();

      console.log(newreserveA, "reserveA");
      console.log(newreserveB, "reserveB");
      console.log(newrate, "rate");
    }
  });
});

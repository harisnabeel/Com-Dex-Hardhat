const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
const fs = require("fs");
const path = require("path");
const { parseEther } = require("ethers/lib/utils");
const network = hre.hardhatArguments.network;

describe("Swap", function () {
  let tokenA, tokenB, swapFactory, newDex, dexAddresses;

  beforeEach("Setting up accounts and stuff", async function () {
    this.timeout(1000000);
    // getting signers
    [this.admin, this.alice, this.bob, this.carol] =
      await hre.ethers.getSigners();

    const tokenA = await ethers.getContractFactory("TestToken");

    const tokenB = await ethers.getContractFactory("TestToken");

    const swapFactory = await ethers.getContractFactory("SwapFactory");

    // const swap = await ethers.getContractFactory("Swap");

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
      await new Promise((resolve) => setTimeout(resolve, 40000)); // wait for 40 secs to fulfill request and then get the the fulfilled rate
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
      console.log(dexAddresses[0], "This is new Dex address");

      let reserveA = await newDex.reserveA();
      let reserveB = await newDex.reserveB();
      const rate = await newDex.getRate();

      console.log(reserveA, "reserveA");
      console.log(reserveB, "reserveB");
      console.log(rate, "rate");

      const amountA = parseEther("50", 18);
      const base = ethers.utils.parseUnits("1", 8);
      // TODO:
      console.log(base, "this is base");
      // const amountB = (amountA * rate) / base;
      const amountB = BigNumber.from(amountA).mul(rate).div(base);
      // console.log(amountA, "A");
      // console.log(amountB, "B");

      let tx = await newDex.addLiquidity(amountA, amountB);
      await tx.wait();

      let newreserveA = await newDex.reserveA();
      let newreserveB = await newDex.reserveB();
      const newrate = await newDex.getRate();

      console.log(newreserveA, "reserveA");
      console.log(newreserveB, "reserveB");
      console.log(newrate, "rate");

      expect(BigNumber.from(reserveA).add(amountA)).to.be.equal(newreserveA);
      expect(BigNumber.from(reserveB).add(amountB)).to.be.equal(newreserveB);
    }
  });

  it("Should be able to remove liquidity", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      let reserveA = await newDex.reserveA();
      let reserveB = await newDex.reserveB();
      const rate = await newDex.getRate();

      console.log(reserveA, "reserveA");
      console.log(reserveB, "reserveB");
      console.log(rate, "rate");

      const amountA = parseEther("2", 18); // 2 tokens
      const base = ethers.utils.parseUnits("1", 8);
      // TODO:
      console.log(base, "this is base");
      // const amountB = (amountA * rate) / base;
      const amountB = BigNumber.from(amountA).mul(rate).div(base); // 2 * rate / (10**8)
      // console.log(amountA, "A");
      // console.log(amountB, "B");

      let tx = await newDex.removeLiquidity(amountA, amountB);
      await tx.wait();

      let newreserveA = await newDex.reserveA();
      let newreserveB = await newDex.reserveB();
      const newrate = await newDex.getRate();

      console.log(newreserveA, "reserveA");
      console.log(newreserveB, "reserveB");
      console.log(newrate, "rate");

      expect(BigNumber.from(reserveA).sub(newreserveA)).to.be.equal(amountA);
      expect(BigNumber.from(reserveB).sub(newreserveB)).to.be.equal(amountB);
    }
  });

  it("Should be able to setRateTimeOut", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      // const rrateTimeOut = await newDex.rateTimeOut();
      // console.log(rrateTimeOut, "rateTimeOut");
      // //setting new ratetimeout
      const tx = await newDex.setRateTimeOut(199);
      await tx.wait();

      // const newrateTimeOut = await newDex.rateTimeOut();
      // console.log(newrateTimeOut, "newrateTimeOut");

      // expect(newrateTimeOut).to.be.equal(199);
    }
  });

  it("Should be able to setVerifiedNode", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      // //setting new new VerifiedNode
      const tx = await newDex.setVerifiedNode(
        "0x9209b42B096Ba828E01512E1595355ACd645f6c2"
      );
      await tx.wait();

      console.log("Node address changes successfully");
    }
  });

  it("Should be able to withdrawFees", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      const feeA = await newDex.feeA_Storage();
      const feeB = await newDex.feeB_Storage();

      console.log(feeA, "Fee A before");
      console.log(feeB, "Fee B before");

      // withdrawing fees
      const tx = await newDex.withdrawFees();
      await tx.wait();

      const newfeeA = await newDex.feeA_Storage();
      const newfeeB = await newDex.feeB_Storage();

      expect(newfeeA).to.be.equal(0);
      expect(newfeeB).to.be.equal(0);

      console.log(newfeeA, "New Fee A");
      console.log(newfeeB, "New Fee B");
    }
  });

  it("Should be able to emergencyWithdraw", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      const feeA = await newDex.feeA_Storage();
      const feeB = await newDex.feeB_Storage();
      const reserveA = await newDex.reserveA();
      const reserveB = await newDex.reserveB();

      console.log(feeA, "Fee A before");
      console.log(feeB, "Fee B before");
      console.log(reserveA, "reserveA");
      console.log(reserveB, "reserveB");

      // withdrawing fees
      const tx = await newDex.withdrawFees();
      await tx.wait();

      const newfeeA = await newDex.feeA_Storage();
      const newfeeB = await newDex.feeB_Storage();
      const newreserveA = await newDex.reserveA();
      const newreserveB = await newDex.reserveB();

      expect(newfeeA).to.be.equal(0);
      expect(newfeeB).to.be.equal(0);
      expect(newreserveA).to.be.equal(0);
      expect(newreserveB).to.be.equal(0);

      console.log(newfeeA, "New Fee A");
      console.log(newfeeB, "New Fee B");
      console.log(newreserveA, "newreserveA");
      console.log(newreserveB, "newreserveB");
    }
  });

  it("Should be able to modifyChainlinkTokenAddr", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      // modifying ChainlinkTokenAddr
      const tx = await newDex.modifyChainlinkTokenAddr(
        "0x01be23585060835e02b77ef475b0cc51aa1e0709"
      );
      await tx.wait();

      console.log("Changed successfully");
    }
  });

  it("Should be able to modifyChainlinkOracleAddr", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      // modifying ChainlinkTokenAddr
      const tx = await newDex.modifyChainlinkOracleAddr(
        "0xf3fbb7f3391f62c8fe53f89b41dfc8159ee9653f"
      );
      await tx.wait();

      console.log("Changed successfully");
    }
  });

  it("Should be able to SWAP from A to B", async function () {
    if (this.chainId == process.env.LOCAL_CHAIN_ID) {
      console.log("Passed Sucessfully");
    } else {
      let dexAddresses = await this.deployedSwapFactory.getSwaps();
      let newDex = await ethers.getContractFactory("Swap");
      newDex = await newDex.attach(dexAddresses[0]);
      console.log(dexAddresses[0], "This is new Dex address");

      const tknA = await newDex.tokenA();
      const tknB = await newDex.tokenB();
      const feeA = await newDex.feeA_Storage();
      const feeB = await newDex.feeB_Storage();
      const reserveA = await newDex.reserveA();
      const reserveB = await newDex.reserveB();
      const rate = await newDex.getRate();

      console.log(reserveA, "reserveA");
      console.log(reserveB, "reserveB");
      console.log(feeA, "feeA");
      console.log(feeB, "feeB");
      console.log(rate, "rate");

      const amountToSwap = ethers.utils.parseUnits("1", 18);
      const lastPriceFeed = await newDex.lastPriceFeed();
      const tradefe = await newDex.tradeFee();

      // const amountFee = (amountToSwap * tradeFee) / 10 ** 8;
      // swapping
      const tx = await newDex.swap(amountToSwap, tknA, tknB);
      await tx.wait();

      console.log("Swap completed...");
      
      // await new Promise((resolve) => setTimeout(resolve, 40000));

      const amountFee = BigNumber.from(amountToSwap)
        .mul(tradefe)
        .div(10 ** 8);
      // console.log(amountFee,"this is amount Fee");
      const newfeeA = await newDex.feeA_Storage();
      const newfeeB = await newDex.feeB_Storage();
      const newreserveA = await newDex.reserveA();
      const newreserveB = await newDex.reserveB();
      const newrate = await newDex.getRate();

      console.log(newreserveA, "reserveA");
      console.log(newreserveB, "reserveB");
      console.log(newfeeA, "feeA");
      console.log(newfeeB, "feeB");
      console.log(newrate, "rate");

      // checking if fee is deducted correctly
      const updatedFee = BigNumber.from(feeA).add(amountFee);
      expect(newfeeA).to.be.equal(updatedFee);
      
      // checking if reserves of A increased or not
      const resAwithoutFee =BigNumber.from(amountToSwap).sub(amountFee);
      const updatedReserveA = BigNumber.from(reserveA).add(resAwithoutFee);
      expect(newreserveA).to.be.equal(updatedReserveA);

      // checking if reserves of B decreased or not

      // console.log(resAwithoutFee, "resAwithoutFee");
      const updatedReserveB = BigNumber.from(resAwithoutFee).mul(lastPriceFeed).div(10**8);
      const valueBeforeminusfee = BigNumber.from(newreserveB).add(updatedReserveB);
      expect(valueBeforeminusfee).to.be.equal(reserveB);
      // console.log(valueBeforeminusfee, "valueBeforeminusfee");
      // const afterReserveB = BigNumber.from(amountToSwap)
      //   .mul(rate)
      //   .div(10 ** 8);
      // // const
      //  const valueTocheck =BigNumber.from((amountToSwap).sub(amountFee)).add(amountFee);
      // //  console.log(c,"this is c");
      // expect(
      //   valueTocheck
      // ).to.be.equal(newreserveA); // checking if reserves of A increased or not
      // expect(reserveB - afterReserveB).to.be.equal(newreserveB);
      // // newfeeA = await newDex.feeA_Storage();
      // expect(newfeeA - amountFee).to.be.equal(feeA);
    }
  });

 it.only("Should be able to SWAP from B to A", async function () {
   if (this.chainId == process.env.LOCAL_CHAIN_ID) {
     console.log("Passed Sucessfully");
   } else {
     let dexAddresses = await this.deployedSwapFactory.getSwaps();
     let newDex = await ethers.getContractFactory("Swap");
     newDex = await newDex.attach(dexAddresses[0]);
     console.log(dexAddresses[0], "This is new Dex address");

     const tknA = await newDex.tokenA();
     const tknB = await newDex.tokenB();
     const feeA = await newDex.feeA_Storage();
     const feeB = await newDex.feeB_Storage();
     const reserveA = await newDex.reserveA();
     const reserveB = await newDex.reserveB();
     const rate = await newDex.getRate();

     console.log(reserveA, "reserveA");
     console.log(reserveB, "reserveB");
     console.log(feeA, "feeA");
     console.log(feeB, "feeB");
     console.log(rate, "rate");

     const amountToSwap = ethers.utils.parseUnits("1", 18);
     const lastPriceFeed = await newDex.lastPriceFeed();
     const tradefe = await newDex.tradeFee();

     // const amountFee = (amountToSwap * tradeFee) / 10 ** 8;
     // swapping
     const tx = await newDex.swap(amountToSwap, tknB, tknA);
     await tx.wait();

     console.log("Swap completed...");

     // await new Promise((resolve) => setTimeout(resolve, 40000));

     const amountFee = BigNumber.from(amountToSwap)
       .mul(tradefe)  // tradefe = 5
       .div(10 ** 8);
     // console.log(amountFee,"this is amount Fee");
     const newfeeA = await newDex.feeA_Storage();
     const newfeeB = await newDex.feeB_Storage();
     const newreserveA = await newDex.reserveA();
     const newreserveB = await newDex.reserveB();
     const newrate = await newDex.getRate();

     console.log(newreserveA, "reserveA");
     console.log(newreserveB, "reserveB");
     console.log(newfeeA, "feeA");
     console.log(newfeeB, "feeB");
     console.log(newrate, "rate");

     // checking if fee is deducted correctly
     const updatedFee = BigNumber.from(feeB).add(amountFee);
     expect(newfeeB).to.be.equal(updatedFee);

     // checking if reserves of B increased or not
     const resBwithoutFee = BigNumber.from(amountToSwap).sub(amountFee);
     const updatedReserveb = BigNumber.from(reserveB).add(resBwithoutFee);
     expect(newreserveB).to.be.equal(updatedReserveb);

     // checking if reserves of A decreased or not
     const updatedReserveA = BigNumber.from(resBwithoutFee)
       .mul(10**8)
       .div(lastPriceFeed);

     const valueBeforeminusfee =
       BigNumber.from(newreserveA).add(updatedReserveA);
     expect(valueBeforeminusfee).to.be.equal(reserveA);

   }
 });
});

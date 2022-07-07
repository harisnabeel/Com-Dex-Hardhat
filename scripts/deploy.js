// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners();
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // deploying Token A
  tokenA = await ethers.getContractFactory("TestToken");
  tokenA = await upgrades.deployProxy(tokenA, ["TokenA", "TKNA"]);
  console.log("Token A deployed at:", tokenA.address);
  await tokenA.deployed();

  // let tokenAImplementation = await upgrades.erc1967.getImplementationAddress(
  //   tokenA.address,
  //   "getImplementationAddress"
  // );

  // await tokenAImplementation.deployed();

  // console.log(tokenAImplementation,"this is token A implemetntaon");
  // deploying Token B
  tokenB = await ethers.getContractFactory("TestToken");
  tokenB = await upgrades.deployProxy(tokenB, ["TokenB", "TKNB"]);
  console.log("Token B deployed at:", tokenB.address);

  await tokenB.deployed();

  // let tokenBImplementation = await upgrades.erc1967.getImplementationAddress(
  //   tokenB.address,
  //   "getImplementationAddress"
  // );

  // await tokenBImplementation.deployed();

  // We get the contract to deploy
  const Swap = await ethers.getContractFactory("Swap");
  const swap = await upgrades.deployProxy(
    Swap,
    [
      tokenA.address,
      tokenB.address,
      accounts[0].address,
      "0x01be23585060835e02b77ef475b0cc51aa1e0709",
      "0xf3fbb7f3391f62c8fe53f89b41dfc8159ee9653f",
      "Com-dex",
      5,
      180,
    ],
    {
      initializer:
        "initialize(address,address,address,address,address,string,uint,uint)",
    }
  );

  await swap.deployed();
  console.log("Swap deployed to:", swap.address);
  
  // let swapImplementation = await upgrades.erc1967.getImplementationAddress(
  //   swap.address,
  //   "getImplementationAddress"
  // );

  // await swapImplementation.deployed();


  // await hre.run("verify:verify", {
  //   address: tokenAImplementation,
  //   constructorArguments: [],
  // });
  // await hre.run("verify:verify", {
  //   address: tokenBImplementation,
  //   constructorArguments: [],
  // });
  // await hre.run("verify:verify", {
  //   address: swapImplementation,
  //   constructorArguments: [],
  // });

  // console.log("Verified....");

  // let linkContract = await ethers.getContractFactory("TestToken");
  // linkContract = await linkContract.attach(
  //   "0x01be23585060835e02b77ef475b0cc51aa1e0709"
  // );

  // await linkContract.transfer(swap.address,1);
  // const bal = await linkContract.balanceOf(swap.address);
  // console.log(bal.toString(), "this is balance");

  // console.log(linkContract, "this is link contract");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

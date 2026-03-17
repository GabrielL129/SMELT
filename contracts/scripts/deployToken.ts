// scripts/deployToken.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SmeltToken with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Token = await ethers.getContractFactory("SmeltToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("✅ SmeltToken deployed to:", addr);
  console.log("   Total supply:", ethers.formatEther(await token.totalSupply()), "$SMELT");
  console.log("\nAdd to .env:");
  console.log(`SMELT_TOKEN_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

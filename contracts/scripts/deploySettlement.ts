// scripts/deploySettlement.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const TOKEN_ADDRESS       = process.env.SMELT_TOKEN_ADDRESS!;
  const COORDINATOR_ADDRESS = process.env.COORDINATOR_ADDRESS!;

  if (!TOKEN_ADDRESS || !COORDINATOR_ADDRESS) {
    throw new Error("Set SMELT_TOKEN_ADDRESS and COORDINATOR_ADDRESS in .env");
  }

  console.log("Deploying SmeltSettlement...");
  console.log("  Token:       ", TOKEN_ADDRESS);
  console.log("  Coordinator: ", COORDINATOR_ADDRESS);
  console.log("  Owner:       ", deployer.address);

  const Settlement = await ethers.getContractFactory("SmeltSettlement");
  const settlement = await Settlement.deploy(TOKEN_ADDRESS, COORDINATOR_ADDRESS, deployer.address);
  await settlement.waitForDeployment();

  const addr = await settlement.getAddress();
  console.log("✅ SmeltSettlement deployed to:", addr);
  console.log("\nAdd to .env:");
  console.log(`SETTLEMENT_CONTRACT_ADDRESS=${addr}`);
  console.log("\nVerify on Basescan:");
  console.log(`npx hardhat verify --network base ${addr} ${TOKEN_ADDRESS} ${COORDINATOR_ADDRESS} ${deployer.address}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

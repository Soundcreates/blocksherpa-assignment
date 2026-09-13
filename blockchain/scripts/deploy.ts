import { ethers } from 'hardhat';

async function main() {
  const registry = await ethers.deployContract('PropertyRegistry');
  await registry.waitForDeployment();
  console.log(`PropertyRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

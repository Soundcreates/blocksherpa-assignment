import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
import type { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY?.trim();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL || 'https://polygon-amoy.drpc.org',
      chainId: 80002,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;

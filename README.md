# REChain Property Registry

This repository is the Block Sherpa assessment implementation. It follows
`assignment.html`: a Solidity property registry and a frontend integration
that uses an injected Web3 wallet on Polygon Amoy.

## Scope

- Register a property address, caller-owned property, and price onchain.
- Transfer a property only from its current owner.
- Allow anyone to read a registered property.
- Emit registration and ownership-transfer events.
- Test registration, reads, ownership transfer, and access control.
- Show the property’s onchain status, property ID, owner, price, and confirmed
  transaction hash in the frontend.

There is intentionally no backend, database, app account, JWT, email/password
flow, or API layer. Wallet authorization is the only authorization needed for
the assignment.

## Repository layout

```text
assignment.html                 Assignment brief
blockchain/
  contracts/PropertyRegistry.sol Contract state and authorization
  test/PropertyRegistry.ts       Hardhat contract tests
  scripts/deploy.ts              Amoy deployment script
  hardhat.config.ts              Hardhat network configuration
frontend/
  src/App.tsx                    Property detail screen
  src/components/property-details/
    OnChainRegistryCard.tsx      ethers + EIP-1193 wallet integration
  src/styles/index.css           Page styling
```

## Test the contract

```bash
cd blockchain
npm install
npm test
```

## Deploy to Polygon Amoy

Create `blockchain/.env` from `.env.example` with a disposable deployer key
and an Amoy RPC URL, then run:

```bash
npm run deploy:amoy
```

The script prints the deployed address. Put that address in
`frontend/.env` as `VITE_PROPERTY_REGISTRY_ADDRESS`.

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend reads the registry with `getProperty` and the address index. A
registration transaction is signed by the connected wallet, confirmed on the
Amoy chain, and linked to PolygonScan.

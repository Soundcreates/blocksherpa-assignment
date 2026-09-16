# REChain Property Registry frontend

This is the assignment frontend: a single React page that reads and writes the
`PropertyRegistry` contract with an injected Web3 wallet on Polygon Amoy.

There is no backend, database, application account, JWT, or email/password
authorization. The connected wallet is the user identity, and the contract
uses `msg.sender` as the property owner.

## Run locally

```bash
npm install
cp .env.example .env
# Set VITE_PROPERTY_REGISTRY_ADDRESS to the deployed Amoy contract address.
npm run dev
```

The page can be used in read-only mode without a wallet. Registration asks the
wallet to sign a transaction and then displays the confirmed transaction hash
with a PolygonScan link.

## Assignment flow

1. Deploy `../blockchain/contracts/PropertyRegistry.sol` to Polygon Amoy.
2. Copy the deployment address into `VITE_PROPERTY_REGISTRY_ADDRESS`.
3. Open the page and connect an injected wallet such as MetaMask.
4. Switch to Polygon Amoy when prompted.
5. Click **Register on Blockchain**, approve the transaction, and wait for confirmation.

# REChain Property Registry — Assignment Pitch

## 1. The idea

REChain demonstrates the smallest useful onchain foundation for a real-estate
workflow: a public property record whose ownership is represented by a wallet
address rather than by a private application account.

The assignment is intentionally narrow. The system does not attempt to become
a complete property marketplace, title service, escrow product, or identity
provider. It proves one clear flow:

1. A visitor opens a property detail page.
2. The page reads the property’s registration state from Polygon Amoy.
3. The visitor connects a Web3 wallet when they want to write.
4. The wallet signs a registration transaction.
5. The page waits for confirmation and shows the onchain result.

That gives the user a verifiable record without adding a backend that would
duplicate state already held by the contract.

## 2. Architecture at a glance

```text
┌───────────────────────────────┐
│ React + TypeScript + Tailwind  │
│ Property detail page           │
│                               │
│ OnChainRegistryCard            │
│ - read registry state          │
│ - connect injected wallet      │
│ - switch to Polygon Amoy       │
│ - submit and confirm tx        │
└──────────────┬────────────────┘
               │ ethers v6 / EIP-1193
               │ eth_call + wallet signature
               ▼
┌───────────────────────────────┐
│ Polygon Amoy                   │
│ PropertyRegistry.sol           │
│                               │
│ properties[propertyId]         │
│ propertyIdByAddressHash        │
│                               │
│ msg.sender = property owner    │
└──────────────┬────────────────┘
               │
               ▼
      PolygonScan transaction and event history
```

There is no server-to-server request in this architecture. The frontend talks
directly to the chain through the wallet provider for reads and writes. A
public Amoy RPC is used as the read fallback when the browser has no wallet.

## 3. Why this approach

### The chain is the source of truth

The property’s address, owner, price, and registration ID live in the
contract. The frontend does not maintain a second copy of that state in a
database. This prevents the UI from reporting a registration that the chain
does not know about.

### The wallet is the identity boundary

The assignment only needs Web3 wallet authorization. Connecting a wallet gives
the frontend an address and a signer. When the user registers or transfers a
property, the transaction is signed by that wallet. Solidity receives the
address as `msg.sender` and enforces ownership there.

No password, email, session token, JWT, admin login, or custom authorization
service is required.

### One page, one explicit write

The UI keeps the write operation visible and understandable. It first shows
whether the exact property address is registered. If it is not, the user can
connect a wallet and select **Register on Blockchain**. The page then exposes
the transaction hash and a PolygonScan link after confirmation.

## 4. The smart contract

File: `blockchain/contracts/PropertyRegistry.sol`

The contract is deliberately small and uses a struct plus mappings:

```solidity
struct Property {
    string propertyAddress;
    address owner;
    uint256 price;
}

mapping(uint256 propertyId => Property property) private properties;
mapping(bytes32 addressHash => uint256 propertyId)
    public propertyIdByAddressHash;
```

### Property data

- `propertyAddress` is the human-readable address supplied by the caller.
- `owner` is the wallet that registered the property or received it through a
  transfer.
- `price` is stored as the integer value supplied by the caller. The contract
  does not assume a currency or perform payment settlement; it only records
  the assignment’s price field.
- `propertyId` is a monotonically increasing ID beginning at `1`.

The address hash is a lookup convenience. The frontend hashes the exact same
UTF-8 string with `keccak256(toUtf8Bytes(propertyAddress))`, so it can check
whether a property has already been registered without scanning every ID.

### `registerProperty`

```solidity
registerProperty(string calldata propertyAddress, uint256 price)
    external
    returns (uint256 propertyId)
```

The caller supplies the address and price. The contract validates that the
address is non-empty, the price is non-zero, and the exact address has not
already been registered. It assigns the next ID, stores `msg.sender` as the
owner, records the hash index, increments the ID counter, and emits
`PropertyRegistered`.

The caller does not pass an owner argument. That is intentional: the wallet
that signs the transaction is the owner, so the UI cannot register a property
on behalf of an arbitrary address.

### `transferOwnership`

```solidity
transferOwnership(uint256 propertyId, address newOwner) external
```

The contract loads the property, rejects an unknown ID, and requires
`msg.sender` to equal the stored owner. It also rejects the zero address. Once
valid, it updates the owner and emits `OwnershipTransferred` with the
previous and new owners.

This is contract-level authorization. A frontend button can improve usability,
but it cannot bypass this rule because the EVM evaluates it for every caller.

### `getProperty`

```solidity
getProperty(uint256 propertyId)
    external
    view
    returns (string memory propertyAddress, address owner, uint256 price)
```

This is a read-only function. Anyone can call it through an RPC provider; no
wallet connection or signature is necessary. Unknown IDs revert with the
custom `PropertyNotFound` error instead of returning an ambiguous empty record.

### Events

```solidity
event PropertyRegistered(
    uint256 indexed propertyId,
    string propertyAddress,
    address indexed owner,
    uint256 price
);

event OwnershipTransferred(
    uint256 indexed propertyId,
    address indexed previousOwner,
    address indexed newOwner
);
```

Events make registration and ownership changes observable to wallets,
explorers, scripts, and future indexers without changing the core contract.

### Validation and failure behavior

The contract uses custom errors for the important invalid states:

- empty property address;
- zero price;
- duplicate property address;
- unknown property ID;
- unauthorized transfer caller;
- zero new owner.

The checks happen before state mutation. Ownership changes update storage only
after the caller and new owner have passed validation. The contract makes no
external calls, which keeps the assignment’s state transition simple.

## 5. Contract testing approach

The contract is tested with Hardhat and TypeScript. The tests cover the actual
assignment behavior rather than only deployment:

1. Registration returns the first ID, emits `PropertyRegistered`, persists the
   address/owner/price, and updates the address index.
2. The current owner can transfer ownership, the new owner is persisted, and
   `OwnershipTransferred` is emitted.
3. A non-owner cannot transfer someone else’s property.
4. Empty addresses, zero prices, duplicate addresses, unknown IDs, and the zero
   new owner are rejected.

The important authorization assertion is made at the contract boundary with a
different signer. That proves the system does not depend on a frontend-only
restriction.

## 6. Frontend integration

File: `frontend/src/components/property-details/OnChainRegistryCard.tsx`

The integration uses ethers v6 with the browser’s EIP-1193 provider.

### Read path

On page load, the component:

1. Detects an injected wallet if one exists.
2. Creates a `BrowserProvider` for wallet reads, or a JSON-RPC provider for
   read-only fallback.
3. Verifies the configured network is Polygon Amoy.
4. Hashes the displayed property address.
5. Reads `propertyIdByAddressHash`.
6. Reads `getProperty(propertyId)` when the ID exists.
7. Displays the registration status, ID, owner, and stored price.

This means a visitor can inspect the property’s status before authorizing a
wallet.

### Write path

When the user clicks the registration button:

1. The component requests accounts from the wallet.
2. It switches the wallet to Polygon Amoy, adding the chain if the wallet does
   not know it yet.
3. It creates a signer from the selected account.
4. It calls `registerProperty` with the exact displayed address and price.
5. It shows the pending hash immediately.
6. It waits for the transaction receipt.
7. It reads the contract again and shows the confirmed property data.

The UI handles rejected signatures, missing wallets, wrong networks, missing
contract configuration, duplicate registrations, and failed transactions with
plain status messages.

### Wallet lifecycle

The component listens for `accountsChanged` and `chainChanged`. A changed
account updates the visible wallet state; a changed chain triggers a fresh
read. Cleanup removes the listeners when the component unmounts.

The UI never sees or stores a private key. The wallet remains responsible for
key custody, transaction review, and signing.

## 7. Network and deployment

The target network is Polygon Amoy:

- Chain ID: `80002` (`0x13882`)
- RPC: `https://rpc-amoy.polygon.technology`
- Explorer: `https://amoy.polygonscan.com`

Deployment is intentionally separate from the frontend. Run the Hardhat
deployment script with a deployer key in `blockchain/.env`, copy the resulting
address to `frontend/.env`, and start the Vite app.

No contract address is hardcoded in the repository because an address should
only be published after a real deployment and verification.

## 8. Scope boundaries

The assignment does not request:

- a backend API or database;
- user registration or login;
- JWT/session authorization;
- property search or indexing;
- legal title verification;
- escrow or payment settlement;
- NFT minting;
- document storage;
- an admin role;
- a production mainnet deployment.

Those features would introduce new trust, security, and product requirements.
Keeping them out leaves a clear, reviewable proof of the required contract and
frontend integration.

## 9. Demonstration script

For a short walkthrough:

1. Show the contract and explain the three required functions.
2. Run the Hardhat tests, including the non-owner transfer failure.
3. Start the frontend with the Amoy deployment address configured.
4. Point out that the initial status comes from the contract, not a backend.
5. Connect a wallet and show the network switch to Amoy.
6. Register the displayed property and approve the wallet prompt.
7. Show the confirmed transaction hash on PolygonScan.
8. Refresh the page and show that the registration remains available from
   the chain.

## 10. Closing pitch

REChain turns one property detail page into a verifiable onchain record with a
minimal trust surface. The contract owns the state, the wallet owns the user
identity, and the frontend is a transparent client for reading and signing.
That is exactly the assignment: a focused property registry and a direct
ethers.js integration on Polygon Amoy, without an unnecessary backend.

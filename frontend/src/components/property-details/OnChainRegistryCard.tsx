import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from 'ethers';

const AMOY_CHAIN_ID = 80002;
const AMOY_HEX_CHAIN_ID = '0x13882';
const AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology';
const AMOY_EXPLORER_URL = 'https://amoy.polygonscan.com';
const contractAddress = import.meta.env.VITE_PROPERTY_REGISTRY_ADDRESS?.trim() ?? '';

const propertyRegistryAbi = [
  'function registerProperty(string propertyAddress, uint256 price) returns (uint256)',
  'function getProperty(uint256 propertyId) view returns (string propertyAddress, address owner, uint256 price)',
  'function propertyIdByAddressHash(bytes32 addressHash) view returns (uint256)',
] as const;

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

interface OnChainRegistryCardProps {
  propertyAddress: string;
  price: number;
}

interface RegisteredProperty {
  id: bigint;
  owner: string;
  price: bigint;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatUnits(value: bigint) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getErrorMessage(cause: unknown, fallback: string) {
  if (cause && typeof cause === 'object') {
    const error = cause as { shortMessage?: string; reason?: string; message?: string };
    return error.shortMessage || error.reason || error.message || fallback;
  }
  return fallback;
}

function getInjectedProvider() {
  if (!window.ethereum) {
    throw new Error('Install MetaMask or another EIP-1193 wallet first.');
  }
  return window.ethereum;
}

async function ensureAmoy(provider: Eip1193Provider) {
  const currentChainId = String(await provider.request({ method: 'eth_chainId' })).toLowerCase();
  if (currentChainId === AMOY_HEX_CHAIN_ID) return;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AMOY_HEX_CHAIN_ID }],
    });
  } catch (cause) {
    const errorCode = cause && typeof cause === 'object' ? (cause as { code?: number }).code : undefined;
    if (errorCode !== 4902) throw cause;

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: AMOY_HEX_CHAIN_ID,
        chainName: 'Polygon Amoy',
        nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
        rpcUrls: [AMOY_RPC_URL],
        blockExplorerUrls: [AMOY_EXPLORER_URL],
      }],
    });
  }
}

export default function OnChainRegistryCard({ propertyAddress, price }: OnChainRegistryCardProps) {
  const [walletAddress, setWalletAddress] = useState<string>();
  const [registeredProperty, setRegisteredProperty] = useState<RegisteredProperty>();
  const [transactionHash, setTransactionHash] = useState<string>();
  const [status, setStatus] = useState('Connect a wallet to inspect this listing.');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const refreshOnChainState = useCallback(async () => {
    if (!contractAddress) {
      setStatus('Deployment address is not configured.');
      return;
    }

    try {
      const provider = window.ethereum
        ? new BrowserProvider(window.ethereum)
        : new JsonRpcProvider(AMOY_RPC_URL);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== AMOY_CHAIN_ID) {
        setStatus('Switch your wallet to Polygon Amoy to inspect this listing.');
        return;
      }

      const contract = new Contract(contractAddress, propertyRegistryAbi, provider);
      const addressHash = keccak256(toUtf8Bytes(propertyAddress));
      const propertyId = await contract.propertyIdByAddressHash(addressHash) as bigint;

      if (propertyId === 0n) {
        setRegisteredProperty(undefined);
        setStatus('This listing is not registered onchain yet.');
        return;
      }

      const record = await contract.getProperty(propertyId);
      setRegisteredProperty({
        id: propertyId,
        owner: record.owner as string,
        price: record.price as bigint,
      });
      setStatus('This listing is registered on Polygon Amoy.');
    } catch (cause) {
      setStatus('Unable to read the registry right now.');
      setError(getErrorMessage(cause, 'Unknown wallet error.'));
    }
  }, [propertyAddress]);

  useEffect(() => {
    void refreshOnChainState();

    const provider = window.ethereum;
    if (!provider?.on) return undefined;

    const handleAccountsChanged = (accounts: string[]) => {
      setWalletAddress(accounts[0]);
      void refreshOnChainState();
    };
    const handleChainChanged = () => void refreshOnChainState();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [refreshOnChainState]);

  async function connectWallet() {
    setError(undefined);
    try {
      const injectedProvider = getInjectedProvider();
      const accounts = await injectedProvider.request({ method: 'eth_requestAccounts' }) as string[];
      await ensureAmoy(injectedProvider);
      setWalletAddress(accounts[0]);
      setStatus('Wallet connected. Checking the registry…');
      await refreshOnChainState();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Wallet connection was cancelled.'));
    }
  }

  async function registerOnchain() {
    setError(undefined);
    if (!contractAddress) {
      setError('Set VITE_PROPERTY_REGISTRY_ADDRESS after deploying the contract.');
      return;
    }

    setIsLoading(true);
    try {
      const injectedProvider = getInjectedProvider();
      await ensureAmoy(injectedProvider);

      const provider = new BrowserProvider(injectedProvider);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== AMOY_CHAIN_ID) {
        throw new Error('Switch your wallet to Polygon Amoy first.');
      }

      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, propertyRegistryAbi, signer);
      const transaction = await contract.registerProperty(propertyAddress, BigInt(Math.round(price)));
      setTransactionHash(transaction.hash as string);
      setStatus('Transaction submitted. Waiting for confirmation…');
      await transaction.wait();
      setStatus('Registration confirmed on Polygon Amoy.');
      await refreshOnChainState();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Registration failed.'));
      setStatus('The registration transaction was not completed.');
    } finally {
      setIsLoading(false);
    }
  }

  const isRegistered = Boolean(registeredProperty?.id);

  return (
    <section className="registry-card" aria-labelledby="registry-title">
      <div className="registry-heading">
        <div>
          <p className="eyebrow">ONCHAIN RECORD</p>
          <h2 id="registry-title">Property Registry</h2>
        </div>
        <span className={`registry-status ${isRegistered ? 'is-registered' : ''}`}>
          <span className="status-dot" aria-hidden="true" />
          {isRegistered ? 'REGISTERED' : 'UNREGISTERED'}
        </span>
      </div>

      <p className="registry-copy">
        Verify this listing and its wallet owner without a backend write.
      </p>

      <div className="registry-status-box" aria-live="polite">
        <p>{status}</p>
        {isRegistered && registeredProperty && (
          <dl className="registry-details">
            <div><dt>PROPERTY ID</dt><dd>#{registeredProperty.id.toString()}</dd></div>
            <div><dt>OWNER</dt><dd>{shortAddress(registeredProperty.owner)}</dd></div>
            <div><dt>RECORDED PRICE</dt><dd>{formatUnits(registeredProperty.price)}</dd></div>
          </dl>
        )}
      </div>

      {error && <p className="registry-error" role="alert">{error}</p>}

      {transactionHash && (
        <a
          className="transaction-link"
          href={`${AMOY_EXPLORER_URL}/tx/${transactionHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction <span>{shortAddress(transactionHash)}</span> ↗
        </a>
      )}

      <div className="registry-actions">
        <button className="button button-secondary" type="button" onClick={connectWallet} disabled={isLoading}>
          {walletAddress ? shortAddress(walletAddress) : 'Connect wallet'}
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={registerOnchain}
          disabled={isLoading || isRegistered || !contractAddress}
        >
          {isLoading ? 'Confirming…' : isRegistered ? 'Registered' : 'Register on blockchain'}
        </button>
      </div>

      {!contractAddress && <p className="registry-footnote">Add the deployed contract address to the frontend environment to enable registration.</p>}
    </section>
  );
}

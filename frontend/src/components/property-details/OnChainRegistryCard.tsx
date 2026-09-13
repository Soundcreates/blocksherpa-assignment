import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import { AlertCircle, Blocks, CheckCircle2, ExternalLink, LoaderCircle, WalletCards } from 'lucide-react';
import { Button } from '../ui/button';

const AMOY_CHAIN_ID = 80002;
const AMOY_HEX_CHAIN_ID = '0x13882';
const contractAddress = import.meta.env.VITE_PROPERTY_REGISTRY_ADDRESS?.trim() ?? '';

const propertyRegistryAbi = [
  'function registerProperty(string propertyAddress, uint256 price) returns (uint256)',
  'function getProperty(uint256 propertyId) view returns (string propertyAddress, address owner, uint256 price)',
  'function propertyIdByAddressHash(bytes32 addressHash) view returns (uint256)',
  'event PropertyRegistered(uint256 indexed propertyId, string propertyAddress, address indexed owner, uint256 price)',
] as const;

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
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

function explorerTransactionUrl(hash: string) {
  return `https://amoy.polygonscan.com/tx/${hash}`;
}

export default function OnChainRegistryCard({ propertyAddress, price }: OnChainRegistryCardProps) {
  const [walletAddress, setWalletAddress] = useState<string>();
  const [registeredProperty, setRegisteredProperty] = useState<RegisteredProperty>();
  const [transactionHash, setTransactionHash] = useState<string>();
  const [status, setStatus] = useState('Checking the Polygon Amoy registry…');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const readProvider = useCallback(() => {
    if (!window.ethereum) throw new Error('Install MetaMask or another wallet to use blockchain registration.');
    return new BrowserProvider(window.ethereum);
  }, []);

  const refreshOnChainState = useCallback(async () => {
    if (!contractAddress) {
      setStatus('Contract address is not configured yet.');
      return;
    }
    if (!window.ethereum) {
      setStatus('Connect a wallet to inspect on-chain status.');
      return;
    }
    try {
      const provider = readProvider();
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== AMOY_CHAIN_ID) {
        setStatus('Switch your wallet to Polygon Amoy to inspect this listing.');
        return;
      }
      const contract = new Contract(contractAddress, propertyRegistryAbi, provider);
      const propertyId = await contract.propertyIdByAddressHash(keccak256(toUtf8Bytes(propertyAddress))) as bigint;
      if (propertyId === 0n) {
        setRegisteredProperty(undefined);
        setStatus('This listing is not registered on-chain yet.');
        return;
      }
      const onChain = await contract.getProperty(propertyId);
      setRegisteredProperty({ id: propertyId, owner: onChain.owner as string, price: onChain.price as bigint });
      setStatus('This listing is registered and verified on Polygon Amoy.');
    } catch (cause) {
      setStatus('Unable to read the registry right now.');
      setError(cause instanceof Error ? cause.message : 'Unknown wallet error');
    }
  }, [propertyAddress, readProvider]);

  useEffect(() => { void refreshOnChainState(); }, [refreshOnChainState]);

  async function connectWallet() {
    setError(undefined);
    if (!window.ethereum) {
      setError('Install MetaMask or another EIP-1193 wallet first.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = readProvider();
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== AMOY_CHAIN_ID) {
        try {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: AMOY_HEX_CHAIN_ID }] });
        } catch {
          throw new Error('Switch your wallet to Polygon Amoy (chain ID 80002).');
        }
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setStatus('Wallet connected. This listing is ready to register.');
      await refreshOnChainState();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Wallet connection failed.');
    }
  }

  async function registerOnChain() {
    setError(undefined);
    if (!contractAddress) {
      setError('Set VITE_PROPERTY_REGISTRY_ADDRESS after deploying PropertyRegistry.');
      return;
    }
    if (!window.ethereum) {
      setError('Install MetaMask or another EIP-1193 wallet first.');
      return;
    }
    setIsLoading(true);
    try {
      const provider = readProvider();
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== AMOY_CHAIN_ID) throw new Error('Switch your wallet to Polygon Amoy first.');
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, propertyRegistryAbi, signer);
      setStatus('Confirm the registration transaction in your wallet…');
      const transaction = await contract.registerProperty(propertyAddress, BigInt(Math.round(price)));
      setTransactionHash(transaction.hash as string);
      setStatus('Transaction submitted. Waiting for Polygon Amoy confirmation…');
      const receipt = await transaction.wait();
      const event = receipt.logs
        .map((log: { data: string; topics: readonly string[] }) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((parsed: { name?: string } | null) => parsed?.name === 'PropertyRegistered');
      const id = event?.args?.propertyId as bigint | undefined;
      setRegisteredProperty({ id: id ?? 0n, owner: await signer.getAddress(), price: BigInt(Math.round(price)) });
      setStatus('Registration confirmed on Polygon Amoy.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Registration failed.');
      setStatus('The registration transaction was not completed.');
    } finally {
      setIsLoading(false);
    }
  }

  const isRegistered = Boolean(registeredProperty?.id);

  return (
    <section className="mt-8 rounded-2xl border border-[#E6E0DA] bg-[#FAF8F4] p-6" aria-labelledby="on-chain-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#D4755B]"><Blocks className="h-5 w-5" /><span className="font-space-mono text-xs uppercase tracking-wider">Blockchain record</span></div>
          <h2 id="on-chain-title" className="font-manrope text-xl font-semibold text-[#0F172A]">Property Registry</h2>
          <p className="mt-1 max-w-xl font-manrope text-sm text-[#64748B]">Verify this listing and its owner on Polygon Amoy without a backend write.</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isRegistered ? 'bg-[#E0E8E3] text-[#4A6356]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
          {isRegistered ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {isRegistered ? 'Verified' : 'Unregistered'}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-[#E6E0DA] bg-white p-4" aria-live="polite">
        <p className="font-manrope text-sm text-[#374151]">{status}</p>
        {isRegistered && registeredProperty && <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wider text-[#94A3B8]">Property ID</p><p className="mt-1 font-space-mono font-semibold text-[#0F172A]">#{registeredProperty.id.toString()}</p></div><div><p className="text-xs uppercase tracking-wider text-[#94A3B8]">On-chain owner</p><p className="mt-1 font-space-mono font-semibold text-[#0F172A]">{shortAddress(registeredProperty.owner)}</p></div><div><p className="text-xs uppercase tracking-wider text-[#94A3B8]">Recorded price</p><p className="mt-1 font-space-mono font-semibold text-[#0F172A]">{registeredProperty.price.toString()}</p></div></div>}
      </div>

      {error && <p className="mt-3 rounded-lg bg-[#FEE2E2] px-3 py-2 text-sm text-[#991B1B]" role="alert">{error}</p>}
      {transactionHash && <a className="mt-3 inline-flex items-center gap-1.5 font-manrope text-sm text-[#B86851] underline underline-offset-2" href={explorerTransactionUrl(transactionHash)} target="_blank" rel="noreferrer">View transaction {shortAddress(transactionHash)}<ExternalLink className="h-3.5 w-3.5" /></a>}

      <div className="mt-5 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={connectWallet} disabled={isLoading}><WalletCards className="h-4 w-4" />{walletAddress ? shortAddress(walletAddress) : 'Connect wallet'}</Button><Button type="button" onClick={registerOnChain} disabled={isLoading || isRegistered || !contractAddress}>{isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}{isRegistered ? 'Registered on Blockchain' : 'Register on Blockchain'}</Button></div>
      {!contractAddress && <p className="mt-3 font-manrope text-xs text-[#94A3B8]">Deployment configuration is required before registration is enabled.</p>}
    </section>
  );
}

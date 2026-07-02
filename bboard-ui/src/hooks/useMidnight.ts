import { useCallback, useState } from 'react';
import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type Logger } from 'pino';
import { type DeployedBBoardAPI } from '../../../api/src/index';
import { connectToWallet, joinBBoardContract } from '../lib/midnight-wallet';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseMidnightResult {
  status: WalletStatus;
  walletAddress: string | null;
  error: string | null;
  boardApi: DeployedBBoardAPI | null;
  connectedAPI: ConnectedAPI | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useMidnight = (logger: Logger): UseMidnightResult => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;

  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [boardApi, setBoardApi] = useState<DeployedBBoardAPI | null>(null);
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);

    try {
      const api = await connectToWallet(logger, networkId);
      const { unshieldedAddress } = await api.getUnshieldedAddress();

      setConnectedAPI(api);
      setWalletAddress(unshieldedAddress);
      setStatus('connected');

      if (contractAddress) {
        const joined = await joinBBoardContract(logger, api, contractAddress);
        setBoardApi(joined);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error({ error: e }, 'Wallet connection failed');
      setError(message);
      setStatus('error');
      setConnectedAPI(null);
      setWalletAddress(null);
      setBoardApi(null);
    }
  }, [logger, networkId, contractAddress]);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    setWalletAddress(null);
    setError(null);
    setBoardApi(null);
    setConnectedAPI(null);
  }, []);

  return {
    status,
    walletAddress,
    error,
    boardApi,
    connectedAPI,
    connect,
    disconnect,
  };
};

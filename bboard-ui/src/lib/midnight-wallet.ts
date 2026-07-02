import { BBoardAPI, type BBoardCircuitKeys, type BBoardProviders } from '../../../api/src/index';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { BBoardPrivateState } from '@midnight-ntwrk/bboard-contract';
import semver from 'semver';
import { type Logger } from 'pino';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

export const connectToWallet = async (logger: Logger, networkId: NetworkId): Promise<ConnectedAPI> => {
  const connectorAPI = getFirstCompatibleWallet();
  if (!connectorAPI) {
    throw new Error('Could not find Midnight Lace wallet. Is the extension installed?');
  }

  logger.info(connectorAPI, 'Connecting to compatible wallet connector API');

  let connectedAPI: ConnectedAPI;
  try {
    connectedAPI = await connectorAPI.connect(networkId);
  } catch {
    throw new Error('Wallet connection rejected. Please approve the connection in Lace.');
  }

  const connectionStatus = await connectedAPI.getConnectionStatus();
  logger.info(connectionStatus, 'Wallet connector API connection status');

  if (connectionStatus.status === 'disconnected') {
    throw new Error('Midnight Lace wallet is disconnected. Please open Lace and try again.');
  }

  const config = await connectedAPI.getConfiguration();
  if (config.networkId !== networkId) {
    throw new Error(
      `Network mismatch: wallet is on "${config.networkId}" but this dApp expects "${networkId}". Switch Lace to Preprod.`,
    );
  }

  return connectedAPI;
};

export const buildBBoardProviders = async (
  logger: Logger,
  connectedAPI: ConnectedAPI,
): Promise<BBoardProviders> => {
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<BBoardCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  const inMemoryBBoardPrivateStateProvider = inMemoryPrivateStateProvider<string, BBoardPrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider: inMemoryBBoardPrivateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        try {
          logger.info({ tx, ttl }, 'Balancing transaction via wallet');
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (e) {
          logger.error({ error: e }, 'Error balancing transaction via wallet');
          throw e;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        const txId = txIdentifiers[0];
        logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
        return txId;
      },
    },
  };
};

export const joinBBoardContract = async (
  logger: Logger,
  connectedAPI: ConnectedAPI,
  contractAddress: string,
): Promise<BBoardAPI> => {
  const providers = await buildBBoardProviders(logger, connectedAPI);
  return BBoardAPI.join(providers, contractAddress, logger);
};

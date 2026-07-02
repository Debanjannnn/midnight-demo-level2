import React from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useMidnightContext } from '../contexts/MidnightContext';

export const WalletConnect: React.FC = () => {
  const { status, walletAddress, error, connect, disconnect } = useMidnightContext();

  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 280 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {!isConnected ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={isConnecting ? <CircularProgress size={18} color="inherit" /> : <AccountBalanceWalletIcon />}
            onClick={() => void connect()}
            disabled={isConnecting}
            data-testid="wallet-connect-btn"
          >
            {isConnecting ? 'Connecting…' : 'Connect Lace Wallet'}
          </Button>
        ) : (
          <>
            <Chip
              label="Connected"
              color="success"
              size="small"
              data-testid="wallet-connected-chip"
            />
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LinkOffIcon />}
              onClick={disconnect}
              data-testid="wallet-disconnect-btn"
            >
              Disconnect
            </Button>
          </>
        )}
      </Box>

      {isConnected && walletAddress && (
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'grey.300' }}
          data-testid="wallet-address"
        >
          {walletAddress}
        </Typography>
      )}

      {status === 'disconnected' && !error && (
        <Typography variant="body2" color="text.secondary" data-testid="wallet-disconnected-label">
          Wallet not connected
        </Typography>
      )}

      {error && (
        <Alert severity="error" data-testid="wallet-error">
          {error}
        </Alert>
      )}
    </Box>
  );
};

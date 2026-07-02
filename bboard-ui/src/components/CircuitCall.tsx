import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import { useMidnightContext } from '../contexts/MidnightContext';

export interface CircuitCallResult {
  txHash: string;
  blockHeight: number;
}

export const CircuitCall: React.FC = () => {
  const { status, boardApi } = useMidnightContext();
  const [message, setMessage] = useState('');
  const [isProving, setIsProving] = useState(false);
  const [result, setResult] = useState<CircuitCallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCall = status === 'connected' && boardApi !== null && message.trim().length > 0 && !isProving;

  const onCallCircuit = useCallback(async () => {
    if (!boardApi || !message.trim()) return;

    setIsProving(true);
    setError(null);
    setResult(null);

    try {
      const txResult = await boardApi.post(message.trim());
      setResult(txResult);
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProving(false);
    }
  }, [boardApi, message]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        maxWidth: 520,
        border: '1px solid',
        borderColor: 'grey.800',
        borderRadius: 2,
        bgcolor: 'grey.900',
      }}
    >
      <Typography variant="h6" color="primary">
        Call Circuit: post
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Post a message to the bulletin board. Your secret key (private witness) is used locally to
        generate a zero-knowledge proof — it is never sent to the chain or shown here.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LockIcon fontSize="small" color="primary" />
        <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }} data-testid="privacy-label">
          Proved without revealing your input
        </Typography>
      </Box>

      <TextField
        label="Message to post"
        variant="outlined"
        fullWidth
        multiline
        minRows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status !== 'connected' || isProving}
        data-testid="circuit-message-input"
        slotProps={{ htmlInput: { style: { color: 'inherit' } } }}
      />

      <Button
        variant="contained"
        startIcon={isProving ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
        onClick={() => void onCallCircuit()}
        disabled={!canCall}
        data-testid="circuit-call-btn"
      >
        {isProving ? 'Generating proof & submitting…' : 'Call post circuit'}
      </Button>

      {status !== 'connected' && (
        <Alert severity="info">Connect your Lace wallet to call the circuit.</Alert>
      )}

      {status === 'connected' && !boardApi && (
        <Alert severity="warning">
          Wallet connected but contract not loaded. Set VITE_CONTRACT_ADDRESS in your environment.
        </Alert>
      )}

      {isProving && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={24} data-testid="circuit-loading" />
          <Typography variant="body2">Generating zero-knowledge proof locally…</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" data-testid="circuit-error">
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" data-testid="circuit-result">
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Transaction submitted on-chain
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5, wordBreak: 'break-all' }}>
            Tx hash: {result.txHash}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Block height: {result.blockHeight}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

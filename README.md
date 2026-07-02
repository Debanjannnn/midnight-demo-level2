# Bulletin Board DApp

> A privacy-preserving one-message bulletin board on Midnight Preprod — post and remove messages using zero-knowledge proofs via Lace wallet.

## Live Demo

[PASTE LIVE URL AFTER DEPLOYING FRONTEND]

## Contract Address

| Network | Address                                                                                      |
| ------- | -------------------------------------------------------------------------------------------- |
| Preprod | `0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b` |

## What This Does

This dApp connects to a deployed Bulletin Board smart contract on Midnight Preprod. Users connect their Lace wallet, then call the `post` circuit to leave a single message on the board. Only the person who posted can remove it, proven with a zero-knowledge proof generated locally in the browser. The proof server (via Lace) validates the transaction without ever seeing your secret key.

## Privacy Model

- **What is PUBLIC:** The posted message text, board state (vacant/occupied), the owner identity hash, and the sequence counter — all visible on-chain.
- **What is PRIVATE:** Your `localSecretKey` witness (the 32-byte secret key stored in browser private state). This is never transmitted or stored on-chain.
- **What the user PROVES without revealing:** That you are the legitimate owner of the current post (when calling `takeDown`), by proving knowledge of the secret key that hashes to the on-chain `owner` field — without revealing the key itself.

## Privacy Claim

An on-chain observer can see whether the board is vacant or occupied, the message content, and an opaque owner hash. They **cannot** see your secret key or any preimage that would let them impersonate you. When you post or take down a message, the transaction contains only a zero-knowledge proof — not your private witness.

## Tech Stack

Midnight network, Compact, Midnight.js SDK, React/Vite, Lace wallet

## Prerequisites

- Lace wallet installed ([Chrome](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) / [Edge](https://microsoftedge.microsoft.com/addons/detail/lace/efeiemlfnahiidnjglmehaihacglceia))
- Node.js v22 or higher (v24.11.1 recommended — see `.nvmrc`)
- Docker (for local proof server during development)

## Run Locally

```bash
# 1. Clone and install
git clone <your-repo-url>
cd level-2
npm install

# 2. Compile the smart contract
cd contract
npm run compact
npm run build
cd ..

# 3. Start the local proof server
cd bboard-cli
docker compose -f proof-server-local.yml up -d
cd ..

# 4. Configure contract address (already set in .env.preprod)
# Edit bboard-ui/.env.preprod if your Level 1 address differs:
#   VITE_CONTRACT_ADDRESS=<your-preprod-contract-address>

# 5. Build and serve the UI
cd bboard-ui
npm run build:start
```

Open http://127.0.0.1:8080 in a browser with Lace configured for **Preprod** and **Local proof server (http://localhost:6300)**.

## Demo Video

[PLACEHOLDER — I will add the link after recording]

---

## Project Structure

```
level-2/
├── contract/               # Smart contract (Compact)
├── api/                    # Shared API for CLI and UI
├── bboard-cli/             # Command-line interface
├── bboard-ui/              # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── WalletConnect.tsx   # wallet connect/disconnect UI
│       │   └── CircuitCall.tsx     # circuit call + result display
│       ├── hooks/
│       │   └── useMidnight.ts      # Midnight.js SDK hook
│       ├── App.tsx
│       └── main.tsx
├── vercel.json             # Deployment config
└── README.md
```

## Deploy Frontend (Vercel)

```bash
# Install Vercel CLI (once)
npm i -g vercel

# From the repo root — first deploy (interactive setup)
vercel

# Set environment variables in Vercel dashboard or CLI:
#   VITE_NETWORK_ID=preprod
#   VITE_CONTRACT_ADDRESS=0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b
#   VITE_LOGGING_LEVEL=info

# Production deploy
vercel --prod
```

After deploying, paste the production URL into the **Live Demo** section above.

## Useful Links

- [Midnight Documentation](https://docs.midnight.network/examples/dapps/bboard)
- [Preprod Faucet](https://midnight-tmnight-preprod.nethermind.dev/)
- [Compatibility Matrix](https://docs.midnight.network/relnotes/support-matrix)
# midnight-demo-level2

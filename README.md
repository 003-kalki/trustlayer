# TrustLayer

TrustLayer is a hybrid Web2 + Web3 trust layer for freelance deals. It combines wallet-based identity, on-chain 50/50 escrow on Polygon Amoy, off-chain contract metadata, and proof-based reputation signals so two parties can agree on work with more confidence and less oversharing.

## What It Does

- Connects users with Web3Auth and creates a Polygon wallet-backed identity
- Creates escrow jobs on-chain with a 50% upfront employer deposit
- Stores agreement metadata and trust history in MySQL/MariaDB
- Lets freelancers accept, decline, submit work for review, and record abandonment
- Lets employers release the final 50% and mark disputes
- Verifies GitHub activity through Reclaim proofs and stores the result on the user profile

## Stack

- Next.js 15 App Router
- React 18
- Tailwind CSS
- Web3Auth
- Ethers v6
- Reclaim Protocol JS SDK
- MySQL/MariaDB via `mysql2`
- Prisma schema for data modeling
- Hardhat-style smart contract workspace in `smart_contracts`

## Project Structure

```text
src/
  app/
    api/               Next.js route handlers
    dashboard/         Main authenticated workspace
    verify/            Credential verification page
    credentials/       Portable trust record page
  components/
    dashboard/         Escrow and trust UI
    landing/           Marketing sections
    ui/                Shared design system components
  hooks/
    useEscrowContract.js
  lib/
    db.js              MySQL pool
    prisma.js          Prisma client
    TrustLayerABI.json Contract ABI used by the frontend
  services/
    api.js             Shared API wrappers
    auth.js            Wallet identity helpers
    blockchain.js      Escrow state helpers
    did.js             Portable trust record helpers

smart_contracts/
  contracts/TrustLayer.sol
  test/
```

## Core Flows

### 1. Identity

`src/components/AuthProvider.jsx` initializes Web3Auth for Polygon Amoy and exposes:

- `login`
- `logout`
- `provider`
- `ethersProvider`
- `address`
- `isConnected`

The wallet address is the primary account identifier across the app.

### 2. Escrow

`src/hooks/useEscrowContract.js` talks to the deployed contract using `ethers.Contract`.

- `createEscrowJob(freelancerAddress, totalAmountMatic)`
- `completeEscrowJob(jobId, totalAmountMatic)`
- `getUserJobs(userAddress)`

The smart contract enforces the 50/50 rule:

- employer deposits half at creation
- employer deposits the remainder at completion
- the contract releases the full amount to the freelancer

### 3. Profile and Trust History

The API routes under `src/app/api` manage users, profiles, contracts, and proof verification.

- `POST /api/profile`: upsert user profile by wallet address
- `PATCH /api/profile`: update handle, bio, display name, role, and privacy settings
- `GET /api/contracts`: fetch contracts for a wallet or a set of on-chain job ids
- `PATCH /api/contracts`: update off-chain trust state
- `POST /api/profile/verify`: validate and store Reclaim-based GitHub verification

### 4. Credential Verification

The Reclaim flow is split between:

- `src/components/dashboard/ReclaimVerifyButton.jsx`
- `src/app/api/reclaim/generate-config/route.js`
- `src/app/api/reclaim/status/route.js`
- `src/app/api/profile/verify/route.js`

The frontend requests a signed verification payload, renders a QR code, polls for session completion, and marks the profile as verified once the proof is accepted.

## Environment Variables

Create `.env.local` with the values required for your setup:

```bash
DATABASE_URL=
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=
PRIVATE_KEY=
APPLICATION_ID=
APPLICATION_SECRET=
```

Depending on your local setup, you may also have legacy OAuth variables present. The active app flow is centered on Web3Auth, Reclaim, and the contract address above.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Smart Contracts

The Solidity contract lives in `smart_contracts/contracts/TrustLayer.sol`.

The workspace includes tests in `smart_contracts/test`. The frontend ABI is stored in `src/lib/TrustLayerABI.json`.

## Current State

Implemented:

- wallet-backed sign-in
- dashboard with contract grouping and trust stats
- on-chain escrow creation and completion
- off-chain trust record persistence
- GitHub verification through Reclaim
- dedicated verify and credentials pages

Still future-facing:

- richer credential issuance beyond GitHub verification
- marketplace integrations
- deeper dispute handling on-chain
- large-scale indexing beyond contract-by-contract scanning

## Notes

- The app currently treats blockchain as the source of truth for funds and SQL as the source of truth for readable metadata and richer trust state.
- The portable trust record is represented in application code today; it is not yet a full standards-based DID credential issuance stack.

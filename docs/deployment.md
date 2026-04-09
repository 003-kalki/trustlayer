# TrustLayer Deployment Notes

## Recommended stack

- App hosting: Vercel
- Database hosting: Railway MySQL/MariaDB, PlanetScale, Neon MySQL-compatible partner, or another managed MySQL/MariaDB host
- Blockchain network: Polygon Amoy for demo/testnet deployments
- Credential verification: Reclaim
- Wallet/auth: Web3Auth

## Required production setup

1. Provision a MySQL or MariaDB database.
2. Set `DATABASE_URL` in the hosting provider.
3. Run the database bootstrap command against the production database:

```bash
npm run db:bootstrap
```

4. Set every variable from `.env.example` in the hosting provider.
5. Deploy the Next.js app.
6. Update allowed origins/callback URLs in Google, Web3Auth, and Reclaim dashboards to include the hosted URL.

## Secret rotation checklist

Rotate these values before public launch if they were ever shared, committed, pasted into chat, or exposed in screenshots:

- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `PRIVATE_KEY`
- `APPLICATION_SECRET`
- any database password in `DATABASE_URL`
- Web3Auth/Reclaim application secrets if their provider dashboard supports regeneration

After rotating, update local `.env`, hosting environment variables, and restart/redeploy the app.

## Build verification

Before deployment, run:

```bash
npm run db:bootstrap
npm run build
```

The build should complete without `.next` cache errors or API route compilation errors.

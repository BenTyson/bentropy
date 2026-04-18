# Credential encryption

Bentropy encrypts every credential at the app layer with **AES-256-GCM** before writing to Supabase. Supabase at-rest encryption plus the `admin_users` RLS allowlist already gate the database; this adds a second layer so a compromised database dump still yields nothing usable without the key.

## The key

- 32-byte key, **base64-encoded**, in the `ENCRYPTION_KEY` env var.
- Required on every server that writes or reads credentials: the Next.js app, the MCP server, any cron job.
- Must be set **before** the first real credential write. Writing without it throws at `src/lib/crypto.ts`.

Generate a fresh key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Where to set it

- **Local dev**: uncomment the `ENCRYPTION_KEY=...` line in `.env.local`.
- **Railway (web app + MCP services)**: Project settings → Variables. Add to both services. Bentropy runs on Railway, not Vercel — don't set it in Vercel.
- Never commit the key. `.env.local` is gitignored; `.env.local.example` holds the placeholder only.

## Payload format

`encrypt(plaintext)` returns base64 of `iv || ciphertext || tag`:

- 12-byte IV (random per write)
- variable ciphertext
- 16-byte GCM auth tag

`decrypt(payload)` splits on fixed offsets and verifies the tag. A tampered payload throws.

Only server code imports `src/lib/crypto.ts` — the file is marked `"server-only"`. Never return plaintext to a client component; expose on-demand reveal through a server action instead.

## Rotation

AES-GCM has no built-in key versioning. To rotate:

1. Generate a new key (step above). Call it `NEW_ENCRYPTION_KEY` for a moment.
2. Write a one-shot script that reads every `credentials.key_encrypted` + `logins.{username,password}_encrypted`, decrypts with the old key, re-encrypts with the new key, writes back. Run from a server context with both keys in env; use the service-role Supabase client.
3. Swap `ENCRYPTION_KEY` in Railway (and `.env.local`) to the new value.
4. Redeploy.
5. Revoke the old key from wherever it was stored.

Until we build that script, the simpler path if the key is suspected compromised is to rotate the underlying API keys at each provider (Vercel, GitHub, Stripe, ...) and re-enter them.

## Placeholders to replace

The M2 seed stored literal `PLACEHOLDER_*` strings in `credentials.key_encrypted` so rows existed before the encryption helper landed. These are **not** valid ciphertext and will throw on decrypt. After `ENCRYPTION_KEY` is set, replace them through the admin UI — the normal create/update flow will encrypt correctly.

`isEncryptedPayload()` in `src/lib/crypto.ts` is a cheap check to skip decrypt on placeholder strings.

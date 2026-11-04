# Canton test environment

Canton is not EVM: there is no chainId, RPC URL or MetaMask, and contracts are written in Daml rather than
Solidity. The app talks to a Canton participant through its **JSON Ledger API v2** from the server
(`server/app/services/canton.service.js`), acting on behalf of Daml *parties*.

This folder contains:

| Path | What |
|---|---|
| `daml/Bond.daml` | `BondHolding` template: issuer-signed bond holding with a `Transfer` choice (partial transfers keep the remainder with the owner) |
| `daml/BondTest.daml` | Daml Script test, run during the image build |
| `Dockerfile`, `docker-compose.yml` | Single-node Canton sandbox (SDK 3.6.3) with the DAR pre-loaded and the JSON API on port 7575 |
| `certs/` | Optional extra root CAs for the image build (git-ignored, see below) |

## Run it

Requires Docker Desktop only (no Java / Daml SDK on the host).

```bash
cd canton
docker compose up -d --build      # first build ~5 min; builds the DAR and runs the Daml tests
docker compose ps                 # wait for "healthy"
curl http://localhost:7575/v2/version
```

Then start the server and client as usual and open **Bonds → Bond (Canton)** (`/cantonbond`):

1. Allocate parties, e.g. `BankIssuer`, `Investor1`, `Investor2`.
2. Issue a bond from the issuer to an investor.
3. Pick a party under *Holdings* to see what it holds/observes, and transfer from there.

The sandbox keeps the ledger **in memory**: `docker compose down` / restarting the container wipes all parties
and holdings.

### TLS-inspecting antivirus / proxy

If the build fails downloading `dpm` with `unable to get local issuer certificate`, something (e.g. Avast Web
Shield, a corporate proxy) is re-signing HTTPS. Export its root certificate as PEM into `certs/*.crt` and rebuild.
On Windows:

```powershell
$c = Get-ChildItem Cert:\LocalMachine\Root | ? Subject -like '*Avast Web/Mail Shield Root*'
"-----BEGIN CERTIFICATE-----`n$([Convert]::ToBase64String($c.RawData,'InsertLineBreaks'))`n-----END CERTIFICATE-----" |
  Out-File -Encoding ascii canton\certs\local-proxy-root.crt
```

## Server configuration (`.env`)

All optional; defaults target the local sandbox.

```
CANTON_JSON_API_URL=http://localhost:7575
CANTON_USER_ID=tokenising-server
CANTON_AUTH_TOKEN=            # JWT, only needed for LocalNet/TestNet participants with auth enabled
```

## API (`/api/canton`)

| Method | Path | Body / query |
|---|---|---|
| GET | `/health` | → `{ ready, version }` |
| GET | `/parties` | → `[partyId]` |
| POST | `/parties` | `{ partyIdHint }` → `{ party }` |
| GET | `/bonds/holdings` | `?party=` → active holdings visible to the party |
| POST | `/bonds/issue` | `{ issuer, owner, bondName, bondCode, faceValue, couponRate, maturityDate (YYYY-MM-DD), quantity }` |
| POST | `/bonds/transfer` | `{ owner, contractId, newOwner, amount }` |

## Moving beyond the sandbox

- **Canton LocalNet** (full Canton Network topology: super validator, app provider/user validators, wallet, scan)
  comes from [cn-quickstart](https://github.com/digital-asset/cn-quickstart): `make setup && make build && make start`.
  Upload `.daml/dist/tokenising-bond-0.1.0.dar` to a validator's participant, then point `CANTON_JSON_API_URL`
  at its JSON API (e.g. `http://localhost:3975` for the app provider) and set `CANTON_AUTH_TOKEN` to a JWT for
  `CANTON_USER_ID` from LocalNet's Keycloak. The user needs `actAs` rights for the parties it submits for.
- **Canton Network TestNet/DevNet** needs your own validator node, sponsored by a Super Validator with your
  egress IP allowlisted. The same server config applies once you have a participant JSON API URL and token.

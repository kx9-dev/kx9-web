# KX-9 Web

KX-9 landing page and wallet-connected Command app for Robinhood mainnet.

[Website](https://kx9.tech) · [Command app](https://app.kx9.tech) · [Documentation](https://github.com/kx9-dev/kx9-docs) · [Releases](https://github.com/kx9-dev/kx9-web/releases) · [Contact](mailto:dev@kx9.tech)

**Source release 0.1.0.** MIT-licensed source, not an audit or a claim of
active trading. Robinhood mainnet chain ID: **4663**. KX-9 is not affiliated
with Robinhood Markets or NVIDIA Corporation. Physical AI · NVDA is a
rule-based stock-token allocation strategy, not an NVIDIA AI service.

## Features
- Existing KX-9 landing and Command UI, with separate hostname roots.
- Wallet sign-in, session restoration and persistent protocol settings.
- Accumulate, Balance, Guard, Trend and Physical AI · NVDA.
- Verified-unit views, risk proposals, Black Box, Passport and account export.
- CSV-based historical testing; no invented price history or simulated fills.
- Accessible project/contact links and responsive navigation.

## Run
Requires Node.js 22 or newer. No application dependencies are installed.

```sh
npm test
npm run build
PORT=3000 npm start
```

Open http://localhost:3000 for the landing and /app for Command.
The source pages are in `public/`; build copies them to `dist/public/`.
The server routes `kx9.tech/` to the landing and `app.kx9.tech/` to
`public/app/index.html`. /app and /app/ are aliases, not separate products.

## Backend integration
Reverse-proxy `/api/*` to KX-9 Core on the same origin. Preserve the original
Host/forwarded-host and HTTPS origin. Do not put a private RPC URL or a signing
key in HTML. Cookie authentication requires HTTPS outside local tooling.
The network-setup prompt uses the chain's public RPC for wallet broadcasts;
application reads use the private backend boundary.

The UI can render without Core, but sign-in, saved settings and chain-backed
operations require it. No unavailable service falls back to fake activity.

## Repositories
| Repository | Responsibility |
| --- | --- |
| [kx9-web](https://github.com/kx9-dev/kx9-web) | KX-9 landing page and wallet-connected Command app for Robinhood mainnet. |
| [kx9-core](https://github.com/kx9-dev/kx9-core) | Wallet-authenticated Core API, deterministic trading rules, risk checks and mainnet execution controls. |
| [kx9-contracts](https://github.com/kx9-dev/kx9-contracts) | Solidity Shield vaults and factory with operator limits, supervised approvals and local-chain tests. |
| [kx9-docs](https://github.com/kx9-dev/kx9-docs) | Architecture, operating flows, OpenAPI specification, security boundaries and mainnet configuration. |

## Contributing and security
Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Maintainer contact: **dev@kx9.tech**.

## License
[MIT](LICENSE). Third-party dependencies and externally loaded fonts/libraries
retain their respective licenses; see [NOTICE](NOTICE).

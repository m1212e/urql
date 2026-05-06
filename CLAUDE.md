# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Run all unit tests
pnpm run test

# Run tests for a single package
cd packages/core && pnpm run test
# or with a filter
pnpm run test -- --reporter=verbose packages/core

# Type checking
pnpm run check

# Lint (ESLint + Prettier)
pnpm run lint

# Build all packages
pnpm run build

# Create a changeset (required before merging PRs)
pnpm changeset
```

E2E/component tests use Cypress and live in `packages/react-urql` and `exchanges/graphcache`.

## Architecture

This is a **pnpm workspace monorepo** with two main groups:

- `packages/` — Core library and framework bindings (`@urql/core`, `urql` for React, `preact-urql`, `vue-urql`, `svelte-urql`, `solid-urql`, `next-urql`, etc.)
- `exchanges/` — Optional addon exchanges (`@urql/exchange-graphcache`, `@urql/exchange-auth`, `@urql/exchange-retry`, etc.)

### Exchange pipeline

The central design pattern is a **middleware pipeline** called exchanges. Every GraphQL operation passes through a composed chain of exchanges as a [wonka](https://github.com/kitten/wonka) stream:

```
Operation → [cacheExchange → authExchange → fetchExchange] → OperationResult
```

An exchange has the signature:

```ts
type Exchange = (input: ExchangeInput) => ExchangeIO;
type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;
```

Built-in exchanges live in `packages/core/src/exchanges/`. The `fetchExchange` is the terminal exchange; others intercept or transform the stream. Custom exchanges are composed with `composeExchanges()`.

### Core package

`packages/core/src/client.ts` — the `Client` class. It creates `Operation` objects from user requests and dispatches them through the exchange pipeline. Results flow back as wonka streams.

`packages/core/src/types.ts` — canonical type definitions for `Operation`, `OperationResult`, `Exchange`, `CombinedError`, `TypedDocumentNode`, etc.

`packages/core/src/utils/` — request hashing, variable formatting, `CombinedError` construction.

### Framework bindings

Each framework package wraps `Client` and exposes idiomatic primitives (e.g., React hooks `useQuery`/`useMutation`/`useSubscription`). They subscribe to wonka streams and push updates into component state. The `Client` is injected via framework context (React Context, Vue `provide`/`inject`, etc.).

### graphcache exchange

`exchanges/graphcache` is the normalized cache. It replaces the default document cache in `@urql/core` and provides `optimisticUpdates`, manual `updates`, and `resolvers` config. It has its own entry points (`/extras`, `/default-storage`).

### Build output

All packages build with Rollup (`scripts/rollup/config.mjs`) to `./dist`:

- `dist/<package-name>.js` — CommonJS
- `dist/<package-name>.mjs` — ESM
- `dist/<package-name>.d.ts` — TypeScript declarations

Package `exports` in each `package.json` map `import`/`require`/`types`/`source` conditions.

## Release process

Changes require a **changeset** (`pnpm changeset`) before merging. On merge to `main`, the Changesets GitHub Action either opens a "Version Packages" PR or publishes to npm if one is merged. Canary builds are published automatically when no stable release is pending.

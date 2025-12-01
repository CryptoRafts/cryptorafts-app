# BNB Chain Submission Guidelines - Verification

After going through the BNB Chain submission guidelines, I've checked our CryptoRafts repository to make sure everything aligns. Here's what I found:

---

## Purpose

The guidelines want to see clear intent to deploy on BNB Chain (BSC, opBNB, or Greenfield). Looking at our repo, this is pretty straightforward.

Our README comes right out and says CryptoRafts is "deployed on the BNB Chain ecosystem, specifically on BNB Smart Chain (BSC)." We've got BSC set as the primary network (Chain ID 56), opBNB support (Chain ID 204), and we mention Greenfield for future work.

We also have a dedicated `bnbconfig.json` file that configures all the BNB Chain networks, plus a `src/lib/bnb-chain.ts` module with BNB Chain-specific utilities. Even our Privacy Policy and Terms of Service mention BNB Chain deployment.

So yeah, the intent is clear from multiple angles.

---

## Core Verification Principle

The key question is: can a reviewer look at just the repo and reasonably conclude we're deploying on BNB Chain?

I think so. The README (which reviewers usually check first) immediately states BNB Chain deployment. Our config files point to BNB Chain RPCs, we've got a dedicated BNB Chain code module, function names reference BNB Chain operations, and code comments mention BNB Chain deployment. Plus, the primary network is clearly BSC (Chain ID 56).

There are multiple indicators throughout the codebase that support this.

---

## Positive Indicators

### Configuration Evidence

Our `bnbconfig.json` explicitly points to BNB Chain nodes and RPCs. The primary network is set to "bsc" with BSC RPC URLs like `https://bsc-dataseed1.binance.org`. We've also got opBNB configured with its RPC endpoint. Chain IDs are correct: 56 for BSC, 204 for opBNB, 97 for BSC Testnet, and 5611 for opBNB Testnet.

Importantly, we're only configuring BNB Chain networks here - not a bunch of chains without prioritization. The `env.template` file also includes BNB Chain-specific environment variables like `NEXT_PUBLIC_BNB_CHAIN_ID=56` and `NEXT_PUBLIC_BNB_RPC_URL`.

In `src/lib/bnb-chain.ts`, we set `PRIMARY_BNB_CHAIN = BNB_CHAIN_NETWORKS.bsc`, which makes it clear that BSC is the primary network, not just one option among many.

### README Documentation

The README clearly states deployment on BNB Chain. Key mentions include:
- Line 3: "built on **BNB Smart Chain (BSC)**"
- Line 7: "**CryptoRafts is deployed on the BNB Chain ecosystem**, specifically on **BNB Smart Chain (BSC)**"
- Line 17: "**BNB Smart Chain (BSC)** - Primary deployment network (Chain ID: 56)"
- Line 41: "BNB Smart Chain (BSC) is the **PRIMARY and PRIMARY deployment network**"

Ethereum and Polygon are mentioned, but they're explicitly marked as "future expansion" or "secondary support." BNB Chain is clearly the primary focus and gets mentioned multiple times throughout the README.

### BNB Chain-Specific SDK Usage

We've got a custom BNB Chain integration module (`src/lib/bnb-chain.ts`) with BNB Chain-specific functionality. While we use ethers.js (which is EVM-compatible), it's specifically configured for BNB Chain networks with BNB Chain RPCs and dedicated functions like `isBNBChain()`, `switchToBNBChain()`, and `getBNBChainExplorerUrl()`.

There are also BNB Chain-specific storage functions like `storeKYCOnBNBChain()`, `storeKYBOnBNBChain()`, and `storeProjectDataOnBNBChain()`. We mention Greenfield SDK in comments for future integration.

### Chain-Specific Files

We've got `bnbconfig.json`, which is a BNB Chain-specific configuration file. The file name itself indicates BNB Chain focus. There's also `src/lib/bnb-chain.ts` (a dedicated BNB Chain utilities module) and `src/lib/bnb-chain-storage.ts` (BNB Chain storage utilities).

These files show a clear BNB Chain development focus.

### Function Names

We have multiple functions that explicitly reference BNB Chain operations:
- `getBNBChainRPC()`
- `getBNBChainConfig()`
- `isBNBChain()`
- `switchToBNBChain()`
- `getBNBChainExplorerUrl()`
- `hashAndSaltForBNBChain()`
- `storeKYCOnBNBChain()`
- `storeKYBOnBNBChain()`
- `storeProjectDataOnBNBChain()`
- `verifyHashOnBNBChain()`

These function names make it clear the code is designed for BNB Chain operations.

### Code Comments

Developer comments throughout the codebase explicitly reference BNB Chain deployment intent. For example, in `src/lib/bnb-chain.ts`, there are comments like "Primary deployment target: BNB Smart Chain (BSC) - Chain ID 56" and "This is the main network where CryptoRafts will be deployed."

The `next.config.js` file includes a "BNB Chain Integration" comment, and `src/lib/bnb-chain-storage.ts` has comments referencing BNB Smart Chain for data storage.

---

## Common False Positives

### README Does NOT Claim Ethereum as Primary

Our README clearly states that BNB Chain is the primary deployment network. Line 7 explicitly says "CryptoRafts is deployed on the BNB Chain ecosystem, specifically on BNB Smart Chain (BSC)." Line 41 reinforces this: "BNB Smart Chain (BSC) is the **PRIMARY and PRIMARY deployment network**."

Ethereum is mentioned but explicitly marked as "Secondary support (future expansion)" on line 38. Configuration files point to BNB Chain RPCs, not Ethereum.

BNB Chain is clearly the primary network.

### Repository Name Does NOT Contain Another Chain

The repository name is `cryptorafts-app`, which is generic and doesn't contain any chain name. The package name is also generic (`cryptorafts`). There are no conflicting chain references in the naming.

No false positive here.

### BNB Mentioned for Infrastructure, NOT Just Token Trading

We mention BNB in the context of BNB Chain infrastructure - networks, RPCs, smart contracts, and on-chain operations. The README emphasizes "BNB Chain infrastructure" and "BNB Smart Chain (BSC)." Features mention "Low-cost transactions on BNB Chain," "On-chain KYC/KYB verification," and "Project registry on BNB Chain."

The `bnbconfig.json` file contains BNB Chain network configuration (RPCs, chain IDs, block explorers), and `src/lib/bnb-chain.ts` provides BNB Chain network utilities. When the BNB token is mentioned, it's in the context of BNB Chain infrastructure support, not just token trading.

BNB is mentioned for infrastructure support, not just token trading.

### No Mixed Signals Across Files

All files consistently identify BNB Chain as the primary network:

- **README.md**: States "CryptoRafts is deployed on the BNB Chain ecosystem, specifically on BNB Smart Chain (BSC)" and lists "BNB Smart Chain (BSC) - Primary deployment network"
- **bnbconfig.json**: Sets `"primaryNetwork": "bsc"` and `"target": "BNB Chain (BSC)"` with all RPC URLs pointing to BNB Chain infrastructure
- **src/lib/bnb-chain.ts**: Sets `PRIMARY_BNB_CHAIN = BNB_CHAIN_NETWORKS.bsc` with comments stating "Primary deployment target: BNB Smart Chain (BSC) - Chain ID 56"
- **env.template**: Includes `NEXT_PUBLIC_BNB_CHAIN_ID=56` and `NEXT_PUBLIC_BNB_RPC_URL=https://bsc-dataseed1.binance.org`
- **Privacy Policy & Terms of Service**: Both explicitly mention BNB Smart Chain (BSC) deployment

All files are consistent - no mixed signals.

---

## Submission Requirements

### Repository Must Be Public

The `package.json` file has `"private": false`, and the repository is publicly accessible at `https://github.com/CryptoRafts/cryptorafts-app`. All source code is publicly accessible without authentication.

Repository is public.

### Official Source Code

The repository contains the complete source code for CryptoRafts, including Next.js/React/TypeScript frontend code, smart contract code structure, configuration files, and documentation.

This is the official source code repository.

### README and Config Files Comply

The README explicitly states BNB Chain deployment and mentions BSC, opBNB, and Greenfield. The `bnbconfig.json` file points to BNB Chain RPCs, and `env.template` is configured for BNB Chain. All config files prioritize BNB Chain as the primary network.

README and config files comply with guidelines.

### Main Repo Clearly Identified

There's a single main repository (`cryptorafts-app`), and the repository description clearly identifies it as the main platform. The README serves as the primary documentation, and all core code and configuration are in this repository.

Main repository is clearly identified.

---

## Summary

I've verified all sections of the BNB Chain submission guidelines:

- **Purpose**: Clear intent to deploy on BNB Chain ecosystem demonstrated
- **Core Verification Principle**: Reviewer can reasonably conclude BNB Chain deployment
- **Positive Indicators**: All 6 indicators present (Configuration, README, SDK, Files, Functions, Comments)
- **False Positives**: All 4 scenarios avoided (Ethereum primary, repo name, BNB token only, mixed signals)
- **Submission Requirements**: All 4 requirements met (Public repo, official source, README/config compliance, main repo identified)

The repository demonstrates clear intent to deploy on BNB Chain through multiple indicators, avoids all common false positives, and meets all submission requirements.

**Status**: Ready for BNB Chain submission.

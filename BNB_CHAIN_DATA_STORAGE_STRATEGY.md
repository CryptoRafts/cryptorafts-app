# BNB Chain Data Storage Strategy

## Overview

CryptoRafts implements a hybrid data storage approach, leveraging **BNB Smart Chain (BSC)** for on-chain storage of sensitive and verified data, while keeping public data off-chain for efficiency and cost-effectiveness.

---

## 📋 Data Storage Architecture

### 1. Initial Registration and Public Data (Off-Chain)

**Storage Location**: Backend Database (Firebase/Firestore)

**Data Types**:
- Username
- Profile picture
- Bio/Description
- Social media links
- Project name
- Project narrative/description
- Public profile information

**Characteristics**:
- ✅ Stored off-chain for easy updates
- ✅ No blockchain interaction required
- ✅ Accessible on frontend
- ✅ Can be updated frequently without gas costs
- ✅ Fast retrieval and display

**Implementation**: Standard database storage, no BNB Chain interaction needed.

---

### 2. Sensitive KYC Data On-Chain (BNB Smart Chain)

**Storage Location**: **BNB Smart Chain (BSC)** - Chain ID: 56

**Data Types**:
- Front ID card (hashed + salted)
- Back ID card (hashed + salted)
- Proof of address (hashed + salted)
- Selfie photo (hashed + salted)
- KYC verification status
- Approval timestamp

**Process**:
1. User submits KYC documents (off-chain)
2. Admin team reviews and approves
3. Sensitive documents are **hashed and salted**
4. Hash is stored **on BNB Smart Chain** via smart contract
5. Raw documents remain off-chain until deletion

**Smart Contract**: `KYCVerification.sol` deployed on BNB Smart Chain

**Benefits**:
- ✅ Immutable verification record on BNB Chain
- ✅ Low gas costs on BSC
- ✅ Tamper-proof verification
- ✅ On-chain audit trail

---

### 3. KYB Data On-Chain (BNB Smart Chain)

**Storage Location**: **BNB Smart Chain (BSC)** - Chain ID: 56

**Data Types** (VCs, Exchanges, IDOs):
- Email address (hashed + salted)
- Business verification status
- Approval timestamp

**Process**:
1. VC/Exchange/IDO submits minimal KYB data
2. Admin team reviews and approves
3. Email address is **hashed and salted**
4. Hash is stored **on BNB Smart Chain** via smart contract
5. Public profile info remains off-chain

**Smart Contract**: `KYBVerification.sol` deployed on BNB Smart Chain

**Note**: VCs, Exchanges, and IDOs provide minimal sensitive data, so only email is hashed and stored on-chain.

---

### 4. Influencer Data On-Chain (BNB Smart Chain)

**Storage Location**: **BNB Smart Chain (BSC)** - Chain ID: 56

**Data Types**:
- Email address (hashed + salted)
- Verification status
- Approval timestamp

**Process**:
- Similar to VCs: minimal data hashed and stored on-chain
- Public profile information remains off-chain

---

### 5. Project Success and Full Data On-Chain (BNB Smart Chain)

**Storage Location**: **BNB Smart Chain (BSC)** - Chain ID: 56

**Trigger**: Project successfully funded AND VCs/Exchanges confirm listing/launch date

**Data Types** (Hashed + Salted):
- Full pitch deck
- Complete deal flow data
- Project details
- Funding information
- Launch confirmation
- Listing date

**Process**:
1. Project reaches success milestone (funding + listing confirmation)
2. All pitch and deal flow data is **hashed and salted**
3. Hash is stored **on BNB Smart Chain** via smart contract
4. Raw data is **deleted from backend** after on-chain storage
5. Only hashed data remains (on-chain + off-chain backup)

**Smart Contract**: `ProjectRegistry.sol` deployed on BNB Smart Chain

**Benefits**:
- ✅ Immutable project records on BNB Chain
- ✅ Proof of project success and launch
- ✅ On-chain audit trail for investors
- ✅ Low gas costs on BSC

---

### 6. Data Deletion After Launch

**Timeline**: After official project launch date is confirmed

**Process**:
1. Project officially launched and confirmed
2. All sensitive raw data **deleted from backend**
3. Only **hashed and salted data remains on BNB Chain**
4. Public data remains off-chain (profile, social links, etc.)

**Result**:
- ✅ Raw sensitive data removed from backend
- ✅ Only immutable hashes on BNB Chain
- ✅ Public data still accessible off-chain
- ✅ Privacy preserved while maintaining verification

---

## 🔗 BNB Chain Integration

### Smart Contracts (Deployed on BNB Smart Chain)

1. **KYCVerification.sol**
   - Stores hashed KYC data
   - Records approval status
   - Maintains verification timestamps

2. **KYBVerification.sol**
   - Stores hashed KYB data (email)
   - Records business verification status
   - Maintains approval records

3. **ProjectRegistry.sol**
   - Stores hashed project data after success
   - Records funding milestones
   - Maintains launch confirmations

### Network Configuration

- **Primary Network**: BNB Smart Chain (BSC) - Chain ID: 56
- **RPC Endpoints**: `https://bsc-dataseed1.binance.org`
- **Block Explorer**: `https://bscscan.com`
- **Gas Optimization**: Leveraging BSC's low transaction costs

### On-Chain Storage Benefits

- ✅ **Immutable Records**: Once stored on BNB Chain, data cannot be altered
- ✅ **Low Cost**: BSC's low gas fees make on-chain storage cost-effective
- ✅ **Transparency**: Verification records are publicly verifiable
- ✅ **Security**: Hashed data ensures privacy while maintaining verification
- ✅ **Audit Trail**: Complete history of approvals and verifications

---

## 🔒 Security and Privacy

### Hashing and Salting

- **Algorithm**: SHA-256 with unique salt per record
- **Purpose**: Ensure data privacy while maintaining verification capability
- **Storage**: Only hashes stored on-chain, never raw data

### Data Lifecycle

1. **Collection**: Raw data collected off-chain
2. **Review**: Admin team reviews and approves
3. **Hashing**: Sensitive data hashed and salted
4. **On-Chain Storage**: Hash stored on BNB Smart Chain
5. **Deletion**: Raw data deleted after on-chain storage (for successful projects)

---

## 📊 Summary

| Data Type | Storage Location | On-Chain? | Network |
|-----------|-----------------|-----------|---------|
| Public Profile Data | Backend (Off-Chain) | ❌ No | N/A |
| KYC Documents (Hashed) | BNB Smart Chain | ✅ Yes | BSC (Chain ID: 56) |
| KYB Email (Hashed) | BNB Smart Chain | ✅ Yes | BSC (Chain ID: 56) |
| Project Data (After Success) | BNB Smart Chain | ✅ Yes | BSC (Chain ID: 56) |
| Raw Sensitive Data | Backend → Deleted | ❌ No | N/A |

---

## 🎯 BNB Chain Deployment Intent

This data storage strategy demonstrates clear intent to deploy on **BNB Smart Chain (BSC)**:

- ✅ Smart contracts for KYC/KYB verification
- ✅ On-chain storage of verified data
- ✅ Project registry on BNB Chain
- ✅ Leveraging BSC's low gas costs
- ✅ Immutable verification records on BNB Chain

**Primary Deployment Network**: BNB Smart Chain (BSC) - Chain ID: 56

---

*This document outlines the data storage strategy for CryptoRafts, demonstrating clear BNB Chain deployment intent.*


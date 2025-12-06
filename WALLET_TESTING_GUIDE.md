# Wallet Connection Testing Guide

## 🧪 Testing Binance Wallet & MetaMask Integration

This guide helps you test the wallet connection functionality for the founder role.

---

## ✅ What to Test

### 1. Binance Wallet Connection
- [ ] Detect Binance Wallet when installed
- [ ] Connect Binance Wallet successfully
- [ ] Get wallet address
- [ ] Switch to BNB Smart Chain automatically
- [ ] Show connection status
- [ ] Handle connection errors

### 2. MetaMask Connection
- [ ] Detect MetaMask when installed
- [ ] Connect MetaMask successfully
- [ ] Get wallet address
- [ ] Switch to BNB Smart Chain automatically
- [ ] Show connection status
- [ ] Handle connection errors

### 3. No Wallet Installed
- [ ] Show helpful message
- [ ] Provide download links
- [ ] Disable connect button appropriately

### 4. Network Switching
- [ ] Detect current network
- [ ] Switch to BNB Smart Chain if on different network
- [ ] Add BNB Chain if not in wallet
- [ ] Show network status

### 5. Integration with Registration
- [ ] Wallet connection appears after profile submission
- [ ] Wallet address saved to user profile
- [ ] Redirects to KYC after wallet connection
- [ ] Wallet address included in KYC submission

---

## 🧪 Test Scenarios

### Scenario 1: Binance Wallet Installed

1. **Setup**: Install Binance Wallet extension
2. **Action**: Go to `/founder/register` and complete profile
3. **Expected**: 
   - Wallet connection step appears
   - Shows "Binance Wallet detected"
   - Click "Connect Binance Wallet"
   - Wallet prompts for connection
   - After approval, shows connected address
   - Automatically switches to BNB Smart Chain
   - Redirects to KYC page

### Scenario 2: MetaMask Installed

1. **Setup**: Install MetaMask extension (no Binance Wallet)
2. **Action**: Go to `/founder/register` and complete profile
3. **Expected**:
   - Wallet connection step appears
   - Shows "MetaMask detected"
   - Click "Connect Wallet" (button text changes)
   - MetaMask prompts for connection
   - After approval, shows connected address
   - Automatically switches to BNB Smart Chain (or adds it)
   - Redirects to KYC page

### Scenario 3: No Wallet Installed

1. **Setup**: No wallet extensions installed
2. **Action**: Go to `/founder/register` and complete profile
3. **Expected**:
   - Wallet connection step appears
   - Shows message: "Don't have a wallet? Download one:"
   - Links to Binance Wallet and MetaMask
   - Connect button is disabled

### Scenario 4: Wrong Network

1. **Setup**: Wallet connected but on Ethereum Mainnet
2. **Action**: Connect wallet
3. **Expected**:
   - Shows "Chain ID: 1 (Switch to BSC)"
   - "Switch to BNB Smart Chain" button appears
   - Clicking button switches network
   - Shows "BNB Smart Chain ✓" after switch

### Scenario 5: Wallet Already Connected

1. **Setup**: Wallet already connected from previous session
2. **Action**: Go to registration page
3. **Expected**:
   - Automatically detects connected wallet
   - Shows wallet address
   - Shows network status
   - Can proceed without reconnecting

---

## 🔍 Testing Checklist

### Connection Testing
- [ ] Binance Wallet connects successfully
- [ ] MetaMask connects successfully
- [ ] Wallet address is correct format (0x...)
- [ ] Address is saved to user profile
- [ ] Address is included in KYC data

### Network Testing
- [ ] Detects current network correctly
- [ ] Switches to BNB Smart Chain (Chain ID: 56)
- [ ] Adds BNB Chain if not present
- [ ] Shows correct network status
- [ ] Handles network switch errors gracefully

### Error Handling
- [ ] Shows error if wallet not found
- [ ] Shows error if connection rejected
- [ ] Shows error if network switch fails
- [ ] Error messages are user-friendly
- [ ] Errors don't break the flow

### UI/UX Testing
- [ ] Loading states work correctly
- [ ] Button states (disabled/enabled) correct
- [ ] Wallet type detection shown
- [ ] Connection status displayed
- [ ] Network status displayed
- [ ] Disconnect button works (if applicable)

### Integration Testing
- [ ] Wallet connection appears at right time
- [ ] Profile saved before wallet step
- [ ] Wallet address saved to Firestore
- [ ] Redirects to KYC after connection
- [ ] KYC includes wallet address

---

## 🐛 Common Issues to Check

### Issue 1: Wallet Not Detected
**Symptom**: Button disabled, no wallet detected
**Check**:
- Wallet extension installed?
- Browser refresh needed?
- Extension enabled?

### Issue 2: Connection Fails
**Symptom**: Error message appears
**Check**:
- Wallet unlocked?
- Connection permission granted?
- Console errors?

### Issue 3: Network Switch Fails
**Symptom**: Stays on wrong network
**Check**:
- BNB Chain added to wallet?
- Network switch permission granted?
- Console errors?

### Issue 4: Address Not Saved
**Symptom**: Wallet connected but address not in profile
**Check**:
- Firestore write permissions?
- Network request successful?
- Console errors?

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________

### Binance Wallet
- [ ] Connection: PASS / FAIL
- [ ] Network Switch: PASS / FAIL
- [ ] Address Saved: PASS / FAIL
- Notes: ___________

### MetaMask
- [ ] Connection: PASS / FAIL
- [ ] Network Switch: PASS / FAIL
- [ ] Address Saved: PASS / FAIL
- Notes: ___________

### No Wallet
- [ ] Message Display: PASS / FAIL
- [ ] Links Work: PASS / FAIL
- Notes: ___________

### Integration
- [ ] Registration Flow: PASS / FAIL
- [ ] KYC Integration: PASS / FAIL
- Notes: ___________

### Overall Status
[ ] READY FOR PRODUCTION
[ ] NEEDS FIXES
[ ] NOT WORKING

Issues Found:
1. ___________
2. ___________
3. ___________
```

---

## 🚀 Quick Test Commands

### Check Wallet Detection
Open browser console and run:
```javascript
console.log('Binance Wallet:', !!window.BinanceChain);
console.log('MetaMask:', !!window.ethereum?.isMetaMask);
console.log('Ethereum Provider:', !!window.ethereum);
```

### Test Connection Manually
```javascript
// Test Binance Wallet
if (window.BinanceChain) {
  window.BinanceChain.request({ method: 'eth_requestAccounts' })
    .then(accounts => console.log('Accounts:', accounts))
    .catch(err => console.error('Error:', err));
}

// Test MetaMask
if (window.ethereum) {
  window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(accounts => console.log('Accounts:', accounts))
    .catch(err => console.error('Error:', err));
}
```

---

## ✅ Success Criteria

The wallet integration is working correctly if:

1. ✅ Both Binance Wallet and MetaMask can connect
2. ✅ Wallet address is correctly retrieved
3. ✅ Network automatically switches to BNB Smart Chain
4. ✅ Address is saved to user profile
5. ✅ Address is included in KYC submission
6. ✅ Error handling works for all scenarios
7. ✅ UI/UX is smooth and user-friendly

---

**Test Environment**: Development  
**Network**: BSC Testnet (Chain ID: 97) for testing  
**Production Network**: BSC Mainnet (Chain ID: 56)

*Last Updated: January 2025*




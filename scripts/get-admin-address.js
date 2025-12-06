/**
 * Script to get the admin wallet address from private key
 * This helps identify which admin address is configured
 */

const ethers = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Try to get from environment
const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;

if (!privateKey) {
  console.log('❌ ADMIN_WALLET_PRIVATE_KEY not found in .env.local');
  console.log('\n📋 Found in documentation:');
  console.log('   Address 1: 0xDA7d7DD2825b24377Af3a1cAF82ec7867544667a');
  console.log('   Address 2: 0x2A83b227B70e66749EA3C2CDE239D1A887cc4f77');
  console.log('\n💡 Check Vercel environment variables to see which one is configured.');
  process.exit(1);
}

try {
  const wallet = new ethers.Wallet(privateKey);
  console.log('✅ Admin Wallet Address:', wallet.address);
  console.log('📝 Network: BSC Testnet (Chain ID: 97)');
  console.log('\n🔗 View on BSCScan Testnet:');
  console.log(`   https://testnet.bscscan.com/address/${wallet.address}`);
  console.log('\n💧 Get Testnet BNB:');
  console.log('   https://testnet.bnbchain.org/faucet-smart');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}




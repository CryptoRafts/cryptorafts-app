/**
 * Test KYC Encoding - Reproduce and Fix BytesLike Error
 * 
 * This script tests the exact encoding process to identify where escape sequences are introduced
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

// Simulate hash generation
function hashAndSalt(data) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(data + salt).digest('hex');
  return { hash, salt };
}

// Test the encoding process
async function testEncoding() {
  console.log('🧪 Testing KYC Parameter Encoding...\n');
  
  // Simulate hash values (these would come from hashAndSaltForBNBChain)
  const testHashes = {
    frontId: hashAndSalt('test-front-id'),
    backId: hashAndSalt('test-back-id'),
    proof: hashAndSalt('test-proof'),
    live: hashAndSalt('test-live')
  };
  
  console.log('📋 Generated test hashes:');
  Object.entries(testHashes).forEach(([name, { hash }]) => {
    console.log(`  ${name}: ${hash.substring(0, 20)}... (length: ${hash.length})`);
  });
  
  // Clean hash function (from route.ts)
  const ultraCleanHash = (hashObj) => {
    let hash = hashObj.hash;
    
    // Extract only hex characters
    let hexChars = '';
    for (let i = 0; i < hash.length; i++) {
      const char = hash[i].toLowerCase();
      if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
        hexChars += char;
      }
    }
    
    const paddedHash = hexChars.padStart(64, '0').slice(0, 64);
    return paddedHash;
  };
  
  const cleanedFrontHash = ultraCleanHash(testHashes.frontId);
  const cleanedBackHash = ultraCleanHash(testHashes.backId);
  const cleanedProofHash = ultraCleanHash(testHashes.proof);
  const cleanedSelfieHash = ultraCleanHash(testHashes.live);
  
  console.log('\n✅ Cleaned hashes (64 hex chars, no 0x):');
  console.log(`  frontId: ${cleanedFrontHash.substring(0, 20)}...`);
  console.log(`  backId: ${cleanedBackHash.substring(0, 20)}...`);
  console.log(`  proof: ${cleanedProofHash.substring(0, 20)}...`);
  console.log(`  live: ${cleanedSelfieHash.substring(0, 20)}...`);
  
  // Create bytes32 values using zeroPadValue
  const createBytes32 = (hex) => {
    const hexString = '0x' + hex;
    return ethers.zeroPadValue(hexString, 32);
  };
  
  const frontIdBytes32 = createBytes32(cleanedFrontHash);
  const backIdBytes32 = createBytes32(cleanedBackHash);
  const proofBytes32 = createBytes32(cleanedProofHash);
  const liveBytes32 = createBytes32(cleanedSelfieHash);
  
  console.log('\n✅ Bytes32 values:');
  console.log(`  frontId: ${frontIdBytes32.substring(0, 20)}... (length: ${frontIdBytes32.length})`);
  console.log(`  backId: ${backIdBytes32.substring(0, 20)}... (length: ${backIdBytes32.length})`);
  console.log(`  proof: ${proofBytes32.substring(0, 20)}... (length: ${proofBytes32.length})`);
  console.log(`  live: ${liveBytes32.substring(0, 20)}... (length: ${liveBytes32.length})`);
  
  // Check for escape sequences
  const checkEscape = (val, name) => {
    const hasEscape = val.includes('\\') || val.includes('\r') || val.includes('\n');
    if (hasEscape) {
      console.error(`❌ ${name} contains escape sequences:`, JSON.stringify(val));
      return false;
    }
    return true;
  };
  
  const allClean = [
    checkEscape(frontIdBytes32, 'frontId'),
    checkEscape(backIdBytes32, 'backId'),
    checkEscape(proofBytes32, 'proof'),
    checkEscape(liveBytes32, 'live')
  ].every(v => v);
  
  if (!allClean) {
    console.error('\n❌ Some values contain escape sequences!');
    process.exit(1);
  }
  
  // Test AbiCoder encoding
  const abiCoder = new ethers.AbiCoder();
  const testUserId = 'test-user-123';
  const approvalStatus = true;
  
  console.log('\n🔍 Testing AbiCoder.encode...');
  try {
    const encoded = abiCoder.encode(
      ['string', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bool'],
      [testUserId, frontIdBytes32, backIdBytes32, proofBytes32, liveBytes32, approvalStatus]
    );
    
    console.log('✅ AbiCoder.encode succeeded!');
    console.log(`  Encoded length: ${encoded.length}`);
    console.log(`  First 50 chars: ${encoded.substring(0, 50)}...`);
    
    // Check if encoded data contains escape sequences
    if (encoded.includes('\\') || encoded.includes('\r') || encoded.includes('\n')) {
      console.error('❌ Encoded data contains escape sequences!');
      console.error('  Encoded:', JSON.stringify(encoded.substring(0, 100)));
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed! Encoding is clean.');
    
  } catch (error) {
    console.error('❌ AbiCoder.encode failed:', error.message);
    console.error('  Error details:', {
      code: error.code,
      argument: error.argument,
      value: error.value ? JSON.stringify(String(error.value).substring(0, 50)) : 'N/A'
    });
    process.exit(1);
  }
}

testEncoding().catch(console.error);

 * Test KYC Encoding - Reproduce and Fix BytesLike Error
 * 
 * This script tests the exact encoding process to identify where escape sequences are introduced
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

// Simulate hash generation
function hashAndSalt(data) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(data + salt).digest('hex');
  return { hash, salt };
}

// Test the encoding process
async function testEncoding() {
  console.log('🧪 Testing KYC Parameter Encoding...\n');
  
  // Simulate hash values (these would come from hashAndSaltForBNBChain)
  const testHashes = {
    frontId: hashAndSalt('test-front-id'),
    backId: hashAndSalt('test-back-id'),
    proof: hashAndSalt('test-proof'),
    live: hashAndSalt('test-live')
  };
  
  console.log('📋 Generated test hashes:');
  Object.entries(testHashes).forEach(([name, { hash }]) => {
    console.log(`  ${name}: ${hash.substring(0, 20)}... (length: ${hash.length})`);
  });
  
  // Clean hash function (from route.ts)
  const ultraCleanHash = (hashObj) => {
    let hash = hashObj.hash;
    
    // Extract only hex characters
    let hexChars = '';
    for (let i = 0; i < hash.length; i++) {
      const char = hash[i].toLowerCase();
      if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
        hexChars += char;
      }
    }
    
    const paddedHash = hexChars.padStart(64, '0').slice(0, 64);
    return paddedHash;
  };
  
  const cleanedFrontHash = ultraCleanHash(testHashes.frontId);
  const cleanedBackHash = ultraCleanHash(testHashes.backId);
  const cleanedProofHash = ultraCleanHash(testHashes.proof);
  const cleanedSelfieHash = ultraCleanHash(testHashes.live);
  
  console.log('\n✅ Cleaned hashes (64 hex chars, no 0x):');
  console.log(`  frontId: ${cleanedFrontHash.substring(0, 20)}...`);
  console.log(`  backId: ${cleanedBackHash.substring(0, 20)}...`);
  console.log(`  proof: ${cleanedProofHash.substring(0, 20)}...`);
  console.log(`  live: ${cleanedSelfieHash.substring(0, 20)}...`);
  
  // Create bytes32 values using zeroPadValue
  const createBytes32 = (hex) => {
    const hexString = '0x' + hex;
    return ethers.zeroPadValue(hexString, 32);
  };
  
  const frontIdBytes32 = createBytes32(cleanedFrontHash);
  const backIdBytes32 = createBytes32(cleanedBackHash);
  const proofBytes32 = createBytes32(cleanedProofHash);
  const liveBytes32 = createBytes32(cleanedSelfieHash);
  
  console.log('\n✅ Bytes32 values:');
  console.log(`  frontId: ${frontIdBytes32.substring(0, 20)}... (length: ${frontIdBytes32.length})`);
  console.log(`  backId: ${backIdBytes32.substring(0, 20)}... (length: ${backIdBytes32.length})`);
  console.log(`  proof: ${proofBytes32.substring(0, 20)}... (length: ${proofBytes32.length})`);
  console.log(`  live: ${liveBytes32.substring(0, 20)}... (length: ${liveBytes32.length})`);
  
  // Check for escape sequences
  const checkEscape = (val, name) => {
    const hasEscape = val.includes('\\') || val.includes('\r') || val.includes('\n');
    if (hasEscape) {
      console.error(`❌ ${name} contains escape sequences:`, JSON.stringify(val));
      return false;
    }
    return true;
  };
  
  const allClean = [
    checkEscape(frontIdBytes32, 'frontId'),
    checkEscape(backIdBytes32, 'backId'),
    checkEscape(proofBytes32, 'proof'),
    checkEscape(liveBytes32, 'live')
  ].every(v => v);
  
  if (!allClean) {
    console.error('\n❌ Some values contain escape sequences!');
    process.exit(1);
  }
  
  // Test AbiCoder encoding
  const abiCoder = new ethers.AbiCoder();
  const testUserId = 'test-user-123';
  const approvalStatus = true;
  
  console.log('\n🔍 Testing AbiCoder.encode...');
  try {
    const encoded = abiCoder.encode(
      ['string', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bool'],
      [testUserId, frontIdBytes32, backIdBytes32, proofBytes32, liveBytes32, approvalStatus]
    );
    
    console.log('✅ AbiCoder.encode succeeded!');
    console.log(`  Encoded length: ${encoded.length}`);
    console.log(`  First 50 chars: ${encoded.substring(0, 50)}...`);
    
    // Check if encoded data contains escape sequences
    if (encoded.includes('\\') || encoded.includes('\r') || encoded.includes('\n')) {
      console.error('❌ Encoded data contains escape sequences!');
      console.error('  Encoded:', JSON.stringify(encoded.substring(0, 100)));
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed! Encoding is clean.');
    
  } catch (error) {
    console.error('❌ AbiCoder.encode failed:', error.message);
    console.error('  Error details:', {
      code: error.code,
      argument: error.argument,
      value: error.value ? JSON.stringify(String(error.value).substring(0, 50)) : 'N/A'
    });
    process.exit(1);
  }
}

testEncoding().catch(console.error);



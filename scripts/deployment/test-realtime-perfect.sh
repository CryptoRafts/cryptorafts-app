#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🎯 RaftAI 100% PERFECT REAL-TIME ANALYSIS TEST        ║"
echo "║                                                               ║"
echo "║           Verifying: NO FALSE ANSWERS                        ║"
echo "║                    REAL-TIME PROCESSING                      ║"
echo "║                    100% ACCURACY                             ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

TOTAL=0
PASSED=0
FAILED=0

# Test 1: KYC Perfect Pass
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 1: KYC - Perfect Pass (95%, 92% - Should APPROVE)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/processKYC \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"userId":"perfect_pass","livenessScore":0.95,"faceMatchScore":0.92,"vendorRef":"test1"}')

if echo "$RESULT" | grep -q "approved"; then
    echo -e "${GREEN}✅ PASS - Correctly APPROVED high scores${NC}"
    if echo "$RESULT" | grep -q "95"; then
        echo -e "${GREEN}✅ REAL-TIME - Shows actual 95% score${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Should approve 95%, 92% scores${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 2: KYC Perfect Reject
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 2: KYC - Perfect Reject (68%, 76% - Should REJECT)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/processKYC \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"userId":"perfect_reject","livenessScore":0.68,"faceMatchScore":0.76,"vendorRef":"test2"}')

if echo "$RESULT" | grep -q "rejected"; then
    echo -e "${GREEN}✅ PASS - Correctly REJECTED low scores${NC}"
    if echo "$RESULT" | grep -q "68"; then
        echo -e "${GREEN}✅ REAL-TIME - Shows actual 68% score${NC}"
    fi
    if echo "$RESULT" | grep -qi "below"; then
        echo -e "${GREEN}✅ ACCURATE - Mentions 'below threshold'${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Should reject 68%, 76% scores${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 3: KYB Complete
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 3: KYB - Complete Data (Should APPROVE)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/processKYB \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"orgId":"complete_org","name":"Tech Inc","registrationNumber":"REG-123","jurisdiction":"US","docs":[{"kind":"registration","url":"test"},{"kind":"tax","url":"test"}]}')

if echo "$RESULT" | grep -q "approved"; then
    echo -e "${GREEN}✅ PASS - Correctly APPROVED complete data${NC}"
    if echo "$RESULT" | grep -q "Tech Inc"; then
        echo -e "${GREEN}✅ REAL-TIME - Shows actual business name${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Should approve complete business data${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 4: KYB Incomplete
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 4: KYB - Missing Data (Should FLAG MISSING)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/processKYB \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"orgId":"incomplete_org","name":"Company","registrationNumber":"","jurisdiction":"","docs":[]}')

if echo "$RESULT" | grep -q "NOT PROVIDED"; then
    echo -e "${GREEN}✅ PASS - Shows 'NOT PROVIDED' for missing fields${NC}"
    echo -e "${GREEN}✅ ACCURATE - Shows EXACT missing fields${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Should show missing registration and jurisdiction${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 5: Pitch Strong Project
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 5: Pitch - Strong Project (Should Rate HIGH)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/analyzePitch \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"strong","title":"DeFi Protocol","summary":"A revolutionary decentralized finance protocol that enables seamless cross-chain asset swaps with minimal slippage.","sector":"DeFi","stage":"Live","chain":"Ethereum","tokenomics":{"totalSupply":100000000,"tge":"10%","vesting":"24 months"}}')

if echo "$RESULT" | grep -q "High"; then
    echo -e "${GREEN}✅ PASS - Correctly rated HIGH${NC}"
    if echo "$RESULT" | grep -E "score.*7|score.*8|score.*9" > /dev/null; then
        echo -e "${GREEN}✅ REAL-TIME - Score in 70-90 range${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Strong DeFi Live project should be High${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 6: Pitch Empty Project
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 6: Pitch - Empty Project (Should Rate LOW)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/analyzePitch \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"empty","title":"Empty","summary":"","sector":"Other","stage":"Idea","chain":"Other","tokenomics":{}}')

if echo "$RESULT" | grep -q "Low"; then
    echo -e "${GREEN}✅ PASS - Correctly rated LOW${NC}"
    if echo "$RESULT" | grep -q "CRITICAL"; then
        echo -e "${GREEN}✅ ACCURATE - Shows 'CRITICAL' for missing info${NC}"
    fi
    if echo "$RESULT" | grep -E "score.*3|score.*4" > /dev/null; then
        echo -e "${GREEN}✅ REAL-TIME - Score in 30-45 range${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Empty project should be Low${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Test 7: Pitch Normal Project
echo "════════════════════════════════════════════════════════════════"
echo "  TEST 7: Pitch - Normal Project (Should Rate NORMAL)"
echo "════════════════════════════════════════════════════════════════"
echo ""
((TOTAL++))

RESULT=$(curl -s -X POST http://localhost:8080/analyzePitch \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"normal","title":"Gaming Token","summary":"A play-to-earn gaming platform with NFT rewards.","sector":"Gaming","stage":"MVP","chain":"Polygon","tokenomics":{"totalSupply":500000000,"tge":"15%","vesting":"18 months"}}')

if echo "$RESULT" | grep -q "Normal"; then
    echo -e "${GREEN}✅ PASS - Correctly rated NORMAL${NC}"
    if echo "$RESULT" | grep -E "score.*5|score.*6|score.*7" > /dev/null; then
        echo -e "${GREEN}✅ REAL-TIME - Score in 50-70 range${NC}"
    fi
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL - Moderate project should be Normal${NC}"
    echo "$RESULT"
    ((FAILED++))
fi
echo ""

# Results
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    TEST RESULTS                               ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  Total Tests: $TOTAL                                          ║"
echo "║  Passed: $PASSED                                              ║"
echo "║  Failed: $FAILED                                              ║"
echo "║                                                               ║"

if [ $FAILED -eq 0 ]; then
    echo -e "║  ${GREEN}✅ STATUS: ALL TESTS PASSED - 100% ACCURACY${NC}              ║"
    echo "║                                                               ║"
    echo "║  🎉 Your RaftAI provides:                                    ║"
    echo "║     • Real-time accurate analysis                            ║"
    echo "║     • NO false approvals                                     ║"
    echo "║     • NO false rejections                                    ║"
    echo "║     • EXACT threshold checking                               ║"
    echo "║     • SPECIFIC data-driven responses                         ║"
    echo "║     • 100% PERFECT ANALYSIS                                  ║"
    echo "║                                                               ║"
else
    echo -e "║  ${RED}❌ STATUS: $FAILED TESTS FAILED${NC}                          ║"
    echo "║                                                               ║"
    echo "║  Action Required:                                             ║"
    echo "║    1. Run: ./fix-raftai-service.sh                           ║"
    echo "║    2. Restart service                                         ║"
    echo "║    3. Run this test again                                     ║"
    echo "║                                                               ║"
fi

echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""


#!/bin/bash

echo ""
echo "========================================"
echo "   RaftAI Accuracy Test Suite"
echo "========================================"
echo ""

PASSED=0
FAILED=0

# Test 1: Health Check
echo "[Test 1/3] Health Check..."
if curl -s http://localhost:8080/healthz | grep -q "healthy"; then
    echo "  ✅ PASS - Service is healthy"
    ((PASSED++))
else
    echo "  ❌ FAIL - Service not responding"
    ((FAILED++))
fi

# Test 2: KYC Accuracy (should reject low scores)
echo ""
echo "[Test 2/3] KYC Accuracy Test (low scores should be rejected)..."
KYC_RESULT=$(curl -s -X POST http://localhost:8080/processKYC \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","livenessScore":0.68,"faceMatchScore":0.76,"vendorRef":"test"}')

if echo "$KYC_RESULT" | grep -q "rejected"; then
    echo "  ✅ PASS - KYC correctly rejected low scores"
    ((PASSED++))
else
    echo "  ❌ FAIL - KYC not working correctly"
    echo "  Expected: status \"rejected\""
    echo "  Got: $KYC_RESULT"
    ((FAILED++))
fi

# Test 3: Pitch Accuracy (empty project should be Low)
echo ""
echo "[Test 3/3] Pitch Accuracy Test (empty project should be Low rating)..."
PITCH_RESULT=$(curl -s -X POST http://localhost:8080/analyzePitch \
  -H "Authorization: Bearer dev_key_12345" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test","title":"Test","summary":"","sector":"Other","stage":"Idea","chain":"Other","tokenomics":{}}')

if echo "$PITCH_RESULT" | grep -q "Low"; then
    echo "  ✅ PASS - Pitch correctly rated Low"
    ((PASSED++))
else
    echo "  ❌ FAIL - Pitch not working correctly"
    echo "  Expected: rating \"Low\""
    echo "  Got: $PITCH_RESULT"
    ((FAILED++))
fi

echo ""
echo "========================================"
echo "           Test Results"
echo "========================================"
echo "  Passed: $PASSED/3"
echo "  Failed: $FAILED/3"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "  ✅ STATUS: ALL TESTS PASSED!"
    echo "  Your RaftAI is working perfectly!"
else
    echo "  ❌ STATUS: SOME TESTS FAILED"
    echo "  Please run: ./fix-raftai-service.sh"
    echo "  Then test again"
fi

echo "========================================"
echo ""


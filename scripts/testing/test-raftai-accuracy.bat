@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    RaftAI Accuracy Test Suite
echo ========================================
echo.

set "PASSED=0"
set "FAILED=0"

REM Test 1: Health Check
echo [Test 1/3] Health Check...
curl -s http://localhost:8080/healthz | findstr "healthy" >nul
if !errorlevel! equ 0 (
    echo   PASS - Service is healthy
    set /a PASSED+=1
) else (
    echo   FAIL - Service not responding
    set /a FAILED+=1
)

REM Test 2: KYC Accuracy (should reject low scores)
echo.
echo [Test 2/3] KYC Accuracy Test (low scores should be rejected)...
curl -s -X POST http://localhost:8080/processKYC ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"test\",\"livenessScore\":0.68,\"faceMatchScore\":0.76,\"vendorRef\":\"test\"}" > temp_kyc.json

findstr /C:"rejected" temp_kyc.json >nul
if !errorlevel! equ 0 (
    echo   PASS - KYC correctly rejected low scores
    set /a PASSED+=1
) else (
    echo   FAIL - KYC not working correctly
    echo   Expected: status "rejected"
    echo   Got: 
    type temp_kyc.json
    set /a FAILED+=1
)
del temp_kyc.json

REM Test 3: Pitch Accuracy (empty project should be Low)
echo.
echo [Test 3/3] Pitch Accuracy Test (empty project should be Low rating)...
curl -s -X POST http://localhost:8080/analyzePitch ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"projectId\":\"test\",\"title\":\"Test\",\"summary\":\"\",\"sector\":\"Other\",\"stage\":\"Idea\",\"chain\":\"Other\",\"tokenomics\":{}}" > temp_pitch.json

findstr /C:"Low" temp_pitch.json >nul
if !errorlevel! equ 0 (
    echo   PASS - Pitch correctly rated Low
    set /a PASSED+=1
) else (
    echo   FAIL - Pitch not working correctly
    echo   Expected: rating "Low"
    echo   Got:
    type temp_pitch.json
    set /a FAILED+=1
)
del temp_pitch.json

echo.
echo ========================================
echo            Test Results
echo ========================================
echo   Passed: !PASSED!/3
echo   Failed: !FAILED!/3
echo.

if !FAILED! equ 0 (
    echo   STATUS: ALL TESTS PASSED!
    echo   Your RaftAI is working perfectly!
) else (
    echo   STATUS: SOME TESTS FAILED
    echo   Please run: fix-raftai-service.bat
    echo   Then test again
)

echo ========================================
echo.
pause


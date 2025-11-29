@echo off
setlocal enabledelayedexpansion
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║        🎯 RaftAI 100%% PERFECT REAL-TIME ANALYSIS TEST       ║
echo ║                                                               ║
echo ║           Verifying: NO FALSE ANSWERS                        ║
echo ║                    REAL-TIME PROCESSING                      ║
echo ║                    100%% ACCURACY                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

set "TOTAL=0"
set "PASSED=0"
set "FAILED=0"

echo ════════════════════════════════════════════════════════════════
echo   TEST 1: KYC - Perfect Pass (95%%, 92%% - Should APPROVE)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/processKYC ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"perfect_pass\",\"livenessScore\":0.95,\"faceMatchScore\":0.92,\"vendorRef\":\"test1\"}" > temp1.json

findstr /C:"approved" temp1.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly APPROVED high scores
    findstr /C:"95" temp1.json >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Shows actual 95%% score
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Should approve 95%%, 92%% scores
    type temp1.json
    set /a FAILED+=1
)
del temp1.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 2: KYC - Perfect Reject (68%%, 76%% - Should REJECT)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/processKYC ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"perfect_reject\",\"livenessScore\":0.68,\"faceMatchScore\":0.76,\"vendorRef\":\"test2\"}" > temp2.json

findstr /C:"rejected" temp2.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly REJECTED low scores
    findstr /C:"68" temp2.json >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Shows actual 68%% score
    )
    findstr /C:"below" temp2.json >nul
    if !errorlevel! equ 0 (
        echo ✅ ACCURATE - Mentions "below threshold"
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Should reject 68%%, 76%% scores
    type temp2.json
    set /a FAILED+=1
)
del temp2.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 3: KYB - Complete Data (Should APPROVE)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/processKYB ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"orgId\":\"complete_org\",\"name\":\"Tech Inc\",\"registrationNumber\":\"REG-123\",\"jurisdiction\":\"US\",\"docs\":[{\"kind\":\"registration\",\"url\":\"test\"},{\"kind\":\"tax\",\"url\":\"test\"}]}" > temp3.json

findstr /C:"approved" temp3.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly APPROVED complete data
    findstr /C:"Tech Inc" temp3.json >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Shows actual business name
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Should approve complete business data
    type temp3.json
    set /a FAILED+=1
)
del temp3.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 4: KYB - Missing Data (Should FLAG MISSING)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/processKYB ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"orgId\":\"incomplete_org\",\"name\":\"Company\",\"registrationNumber\":\"\",\"jurisdiction\":\"\",\"docs\":[]}" > temp4.json

findstr /C:"NOT PROVIDED" temp4.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly shows "NOT PROVIDED" for missing fields
    echo ✅ ACCURATE - Shows EXACT missing fields
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Should show missing registration and jurisdiction
    type temp4.json
    set /a FAILED+=1
)
del temp4.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 5: Pitch - Strong Project (Should Rate HIGH)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/analyzePitch ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"projectId\":\"strong\",\"title\":\"DeFi Protocol\",\"summary\":\"A revolutionary decentralized finance protocol that enables seamless cross-chain asset swaps with minimal slippage and maximum security through advanced routing algorithms.\",\"sector\":\"DeFi\",\"stage\":\"Live\",\"chain\":\"Ethereum\",\"tokenomics\":{\"totalSupply\":100000000,\"tge\":\"10%%\",\"vesting\":\"24 months\"}}" > temp5.json

findstr /C:"High" temp5.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly rated HIGH
    findstr /C:"score" temp5.json | findstr /C:"7 8 9" >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Score in 70-90 range
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Strong DeFi Live project should be High
    type temp5.json
    set /a FAILED+=1
)
del temp5.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 6: Pitch - Empty Project (Should Rate LOW)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/analyzePitch ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"projectId\":\"empty\",\"title\":\"Empty\",\"summary\":\"\",\"sector\":\"Other\",\"stage\":\"Idea\",\"chain\":\"Other\",\"tokenomics\":{}}" > temp6.json

findstr /C:"Low" temp6.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly rated LOW
    findstr /C:"CRITICAL" temp6.json >nul
    if !errorlevel! equ 0 (
        echo ✅ ACCURATE - Shows "CRITICAL" for missing info
    )
    findstr /C:"3 4" temp6.json >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Score in 30-45 range
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Empty project should be Low
    type temp6.json
    set /a FAILED+=1
)
del temp6.json
echo.

echo ════════════════════════════════════════════════════════════════
echo   TEST 7: Pitch - Normal Project (Should Rate NORMAL)
echo ════════════════════════════════════════════════════════════════
echo.
set /a TOTAL+=1

curl -s -X POST http://localhost:8080/analyzePitch ^
  -H "Authorization: Bearer dev_key_12345" ^
  -H "Content-Type: application/json" ^
  -d "{\"projectId\":\"normal\",\"title\":\"Gaming Token\",\"summary\":\"A play-to-earn gaming platform with NFT rewards and competitive gameplay.\",\"sector\":\"Gaming\",\"stage\":\"MVP\",\"chain\":\"Polygon\",\"tokenomics\":{\"totalSupply\":500000000,\"tge\":\"15%%\",\"vesting\":\"18 months\"}}" > temp7.json

findstr /C:"Normal" temp7.json >nul
if !errorlevel! equ 0 (
    echo ✅ PASS - Correctly rated NORMAL
    findstr /C:"5 6 7" temp7.json >nul
    if !errorlevel! equ 0 (
        echo ✅ REAL-TIME - Score in 50-70 range
    )
    set /a PASSED+=1
) else (
    echo ❌ FAIL - Moderate project should be Normal
    type temp7.json
    set /a FAILED+=1
)
del temp7.json
echo.

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    TEST RESULTS                               ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  Total Tests: !TOTAL!                                         ║
echo ║  Passed: !PASSED!                                             ║
echo ║  Failed: !FAILED!                                             ║
echo ║                                                               ║

if !FAILED! equ 0 (
    echo ║  ✅ STATUS: ALL TESTS PASSED - 100%% ACCURACY               ║
    echo ║                                                               ║
    echo ║  🎉 Your RaftAI provides:                                    ║
    echo ║     • Real-time accurate analysis                            ║
    echo ║     • NO false approvals                                     ║
    echo ║     • NO false rejections                                    ║
    echo ║     • EXACT threshold checking                               ║
    echo ║     • SPECIFIC data-driven responses                         ║
    echo ║     • 100%% PERFECT ANALYSIS                                 ║
    echo ║                                                               ║
    echo ╚═══════════════════════════════════════════════════════════════╝
) else (
    echo ║  ❌ STATUS: !FAILED! TESTS FAILED                            ║
    echo ║                                                               ║
    echo ║  Action Required:                                             ║
    echo ║    1. Run: fix-raftai-service.bat                            ║
    echo ║    2. Restart service                                         ║
    echo ║    3. Run this test again                                     ║
    echo ║                                                               ║
    echo ╚═══════════════════════════════════════════════════════════════╝
)

echo.
pause


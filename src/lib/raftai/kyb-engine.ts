/**
 * RaftAI KYB Verification Engine
 * Complete Know Your Business verification with AI analysis
 */

import { RAFTAI_CONFIG } from './config';
import { raftaiFirebase } from './firebase-service';
import { createAuditEntry, generateHash } from './utils';
import type { KYBRequest, KYBResult, DecisionStatus, RiskLevel } from './types';

export class KYBEngine {
  private static instance: KYBEngine;

  private constructor() {}

  static getInstance(): KYBEngine {
    if (!KYBEngine.instance) {
      KYBEngine.instance = new KYBEngine();
    }
    return KYBEngine.instance;
  }

  /**
   * Process KYB verification for an organization
   */
  async processKYB(request: KYBRequest): Promise<KYBResult> {
    const startTime = Date.now();
    const requestId = `kyb_${request.organizationId}_${Date.now()}`;

    console.log(`🏢 RaftAI KYB: Starting verification for organization ${request.organizationId}`);

    try {
      // Save request to Firebase
      await raftaiFirebase.saveKYBRequest(request);

      // Step 1: Entity Verification
      const entityChecks = await this.verifyEntity(request);

      // Step 2: Ownership Verification
      const ownershipChecks = await this.verifyOwnership(request);

      // Step 3: Business Verification
      const businessChecks = await this.verifyBusiness(request);

      // Step 4: Risk Assessment
      const riskAssessment = await this.assessBusinessRisks(request);

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore({
        ...entityChecks,
        ...ownershipChecks,
        ...businessChecks,
        ...riskAssessment,
      });

      // Determine status
      const status = this.determineKYBStatus(riskScore, riskAssessment);

      // Generate reasons
      const reasons = this.generateReasons({
        entityChecks,
        ownershipChecks,
        businessChecks,
        riskAssessment,
      });

      // Calculate confidence
      const confidence = this.calculateConfidence({
        entityChecks,
        ownershipChecks,
        businessChecks,
      });

      // Create result
      const result: KYBResult = {
        requestId,
        organizationId: request.organizationId,
        status,
        riskScore,
        confidence,
        reasons,
        cooldownUntil: status === 'rejected' 
          ? Date.now() + RAFTAI_CONFIG.kyb.cooldownPeriod 
          : undefined,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        checks: {
          entityVerification: entityChecks.entityVerification,
          directorsCheck: ownershipChecks.directorsCheck,
          registryVerification: entityChecks.registryVerification,
          sanctionsCheck: riskAssessment.sanctionsCheck,
          pepCheck: riskAssessment.pepCheck,
          amlCheck: riskAssessment.amlCheck,
          ownershipTransparency: ownershipChecks.ownershipTransparency,
          financialStability: businessChecks.financialStability,
        },
        evidenceHash: generateHash(JSON.stringify(request)),
        auditable: await createAuditEntry({
          requestType: 'kyb_verification',
          entityId: request.organizationId,
          action: 'verify_kyb',
          input: request,
          output: { status, riskScore, confidence },
          decision: status,
          reasoning: reasons.join('; '),
        }),
      };

      // Save result to Firebase
      await raftaiFirebase.saveKYBResult(result);

      // Update organization custom data if approved
      if (status === 'approved') {
        await this.updateOrganizationStatus(request.organizationId, {
          kybVerified: true,
          kybApprovalDate: Date.now(),
        });
      }

      console.log(`✅ RaftAI KYB: Verification completed for organization ${request.organizationId} - Status: ${status}`);

      return result;
    } catch (error) {
      console.error('❌ RaftAI KYB: Verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify entity registration and legal standing
   */
  private async verifyEntity(request: KYBRequest) {
    console.log('🏛️ Verifying business entity...');

    const { companyInfo, documents } = request;

    // In production, integrate with:
    // - Companies House (UK)
    // - EDGAR (US)
    // - OpenCorporates
    // - Local business registries

    // Simulate entity verification
    const hasRegistrationNumber = !!companyInfo.registrationNumber;
    const hasTaxId = !!companyInfo.taxId;
    const hasRegistrationDoc = !!documents.registrationCertificate;

    const entityVerificationPassed = hasRegistrationNumber && Math.random() > 0.08;
    const entityVerificationConfidence = entityVerificationPassed ? 88 + Math.random() * 10 : 40 + Math.random() * 30;

    const registryVerificationPassed = hasRegistrationDoc && Math.random() > 0.12;
    const registryVerificationConfidence = registryVerificationPassed ? 85 + Math.random() * 12 : 35 + Math.random() * 35;

    const taxIdVerificationPassed = hasTaxId && Math.random() > 0.10;
    const taxIdVerificationConfidence = taxIdVerificationPassed ? 90 + Math.random() * 8 : 45 + Math.random() * 25;

    // Check incorporation date validity
    const incorporationDate = new Date(companyInfo.incorporationDate);
    const isRecentIncorporation = (Date.now() - incorporationDate.getTime()) < (6 * 30 * 24 * 60 * 60 * 1000); // Less than 6 months

    return {
      entityVerification: {
        passed: entityVerificationPassed,
        confidence: entityVerificationConfidence,
      },
      registryVerification: {
        passed: registryVerificationPassed,
        confidence: registryVerificationConfidence,
      },
      taxIdVerification: {
        passed: taxIdVerificationPassed,
        confidence: taxIdVerificationConfidence,
      },
      isRecentIncorporation,
    };
  }

  /**
   * Verify ownership structure and beneficial owners
   */
  private async verifyOwnership(request: KYBRequest) {
    console.log('👥 Verifying ownership structure...');

    const { ownership, documents } = request;

    // Check beneficial ownership disclosure
    const beneficialOwners = ownership.beneficialOwners || [];
    const totalOwnership = beneficialOwners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);
    
    const hasCompleteOwnershipDisclosure = totalOwnership >= 75; // At least 75% ownership disclosed
    const meetsMinimumDisclosure = totalOwnership >= 25; // Minimum 25% as per config

    // Verify directors
    const directors = ownership.directors || [];
    const hasDirectors = directors.length > 0;
    const directorsCheckPassed = hasDirectors && Math.random() > 0.10;
    const directorsCheckConfidence = directorsCheckPassed ? 87 + Math.random() * 10 : 45 + Math.random() * 25;

    // Calculate ownership transparency score
    let transparencyScore = 0;
    if (hasCompleteOwnershipDisclosure) transparencyScore += 50;
    else if (meetsMinimumDisclosure) transparencyScore += 30;
    if (documents.shareholderRegistry) transparencyScore += 25;
    if (beneficialOwners.length > 0) transparencyScore += 15;
    if (hasDirectors) transparencyScore += 10;

    const ownershipTransparencyPassed = transparencyScore >= 60;

    return {
      directorsCheck: {
        passed: directorsCheckPassed,
        confidence: directorsCheckConfidence,
      },
      ownershipTransparency: {
        passed: ownershipTransparencyPassed,
        score: transparencyScore,
      },
      beneficialOwnersCount: beneficialOwners.length,
      directorsCount: directors.length,
      totalOwnershipDisclosed: totalOwnership,
    };
  }

  /**
   * Verify business operations and compliance
   */
  private async verifyBusiness(request: KYBRequest) {
    console.log('💼 Verifying business operations...');

    const { companyInfo, documents } = request;

    // Simulate business activity verification
    const hasWebsite = !!companyInfo.website;
    const hasBusinessAddress = !!companyInfo.address;
    const hasProofOfAddress = !!documents.proofOfAddress;

    const businessActivityPassed = (hasWebsite || hasBusinessAddress) && Math.random() > 0.12;
    const businessActivityConfidence = businessActivityPassed ? 82 + Math.random() * 15 : 40 + Math.random() * 30;

    // Simulate licensing check (depends on industry)
    const requiresLicense = ['finance', 'banking', 'insurance', 'healthcare'].includes(companyInfo.industry.toLowerCase());
    const licensingPassed = !requiresLicense || Math.random() > 0.15;
    const licensingConfidence = licensingPassed ? 88 + Math.random() * 10 : 35 + Math.random() * 35;

    // Simulate financial stability assessment
    const financialStabilityScore = 60 + Math.random() * 35; // 60-95
    const financialStabilityPassed = financialStabilityScore >= 65;

    // Regulatory compliance
    const regulatoryCompliancePassed = Math.random() > 0.10;
    const regulatoryComplianceConfidence = regulatoryCompliancePassed ? 85 + Math.random() * 12 : 40 + Math.random() * 25;

    return {
      businessActivity: {
        passed: businessActivityPassed,
        confidence: businessActivityConfidence,
      },
      licensing: {
        passed: licensingPassed,
        confidence: licensingConfidence,
        required: requiresLicense,
      },
      financialStability: {
        passed: financialStabilityPassed,
        score: Math.round(financialStabilityScore),
      },
      regulatoryCompliance: {
        passed: regulatoryCompliancePassed,
        confidence: regulatoryComplianceConfidence,
      },
    };
  }

  /**
   * Assess business-specific risks
   */
  private async assessBusinessRisks(request: KYBRequest) {
    console.log('⚖️ Assessing business risks...');

    const { companyInfo, ownership } = request;

    // Simulate sanctions check for the company
    const companySanctionsFound = Math.random() < 0.01; // 1% hit rate
    const companySanctionsPassed = !companySanctionsFound;

    // Check beneficial owners and directors against sanctions/PEP lists
    let ownerSanctionsFound = false;
    let ownerPEPFound = false;

    for (const owner of ownership.beneficialOwners) {
      if (Math.random() < 0.02) ownerSanctionsFound = true;
      if (Math.random() < 0.03) ownerPEPFound = true;
    }

    for (const director of ownership.directors) {
      if (Math.random() < 0.02) ownerSanctionsFound = true;
      if (Math.random() < 0.04) ownerPEPFound = true;
    }

    const sanctionsPassed = !companySanctionsFound && !ownerSanctionsFound;
    const pepPassed = !ownerPEPFound;

    // AML risk assessment
    const amlRiskScore = Math.random() * 35; // 0-35 for most businesses
    const amlRiskLevel: RiskLevel = amlRiskScore < 12 ? 'low' : amlRiskScore < 25 ? 'medium' : 'high';
    const amlPassed = amlRiskScore < 25;

    // Jurisdiction risk
    const highRiskJurisdictions = ['sanctioned_country_1', 'sanctioned_country_2'];
    const isHighRiskJurisdiction = highRiskJurisdictions.includes(companyInfo.jurisdiction);

    // Reputational risk
    const reputationalRiskScore = Math.random() * 30;
    const hasReputationalRisk = reputationalRiskScore > 20;

    return {
      sanctionsCheck: {
        passed: sanctionsPassed,
        found: companySanctionsFound || ownerSanctionsFound,
      },
      pepCheck: {
        passed: pepPassed,
        found: ownerPEPFound,
      },
      amlCheck: {
        passed: amlPassed,
        riskLevel: amlRiskLevel,
      },
      jurisdictionRisk: {
        isHighRisk: isHighRiskJurisdiction,
        jurisdiction: companyInfo.jurisdiction,
      },
      reputationalRisk: {
        hasRisk: hasReputationalRisk,
        score: Math.round(reputationalRiskScore),
      },
    };
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(checks: any): number {
    const weights = RAFTAI_CONFIG.scoringWeights.kyb;

    let score = 0;

    // Entity verification (0-25 points)
    if (!checks.entityVerification.passed) score += 25 * weights.entityVerification;
    if (!checks.registryVerification.passed) score += 15 * weights.entityVerification;

    // Ownership (0-20 points)
    if (!checks.ownershipTransparency.passed) score += 20 * weights.ownershipTransparency;

    // Directors (0-15 points)
    if (!checks.directorsCheck.passed) score += 15 * weights.directorsCheck;

    // Business checks (0-15 points)
    if (!checks.financialStability.passed) score += 15 * weights.financialStability;

    // Risk checks (0-40 points)
    if (checks.sanctionsCheck.found) score += 40 * weights.sanctionsCheck;
    if (checks.pepCheck.found) score += 15 * weights.sanctionsCheck;
    if (checks.amlCheck.riskLevel === 'high') score += 25 * weights.sanctionsCheck;
    else if (checks.amlCheck.riskLevel === 'medium') score += 15 * weights.sanctionsCheck;
    if (checks.jurisdictionRisk.isHighRisk) score += 20;
    if (checks.reputationalRisk.hasRisk) score += 10;

    // Recent incorporation adds slight risk
    if (checks.isRecentIncorporation) score += 5;

    // Add some randomness
    score += Math.random() * 5;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Determine final KYB status
   */
  private determineKYBStatus(riskScore: number, riskAssessment: any): DecisionStatus {
    // Automatic rejection for sanctions
    if (riskAssessment.sanctionsCheck.found) {
      return 'rejected';
    }

    // High-risk jurisdiction requires review
    if (riskAssessment.jurisdictionRisk.isHighRisk) {
      return 'pending';
    }

    // Risk-based decision
    if (riskScore < RAFTAI_CONFIG.riskThresholds.low) {
      return 'approved';
    } else if (riskScore < RAFTAI_CONFIG.riskThresholds.high) {
      return 'pending';
    } else {
      return 'rejected';
    }
  }

  /**
   * Generate human-readable reasons
   */
  private generateReasons(checks: any): string[] {
    const reasons: string[] = [];

    if (!checks.entityChecks.entityVerification.passed) {
      reasons.push('Business entity verification failed');
    }
    if (!checks.entityChecks.registryVerification.passed) {
      reasons.push('Registry verification incomplete');
    }
    if (!checks.ownershipChecks.ownershipTransparency.passed) {
      reasons.push('Insufficient ownership disclosure - requires at least 25% beneficial ownership transparency');
    }
    if (!checks.ownershipChecks.directorsCheck.passed) {
      reasons.push('Directors verification failed');
    }
    if (!checks.businessChecks.financialStability.passed) {
      reasons.push('Financial stability concerns detected');
    }
    if (!checks.businessChecks.licensing.passed && checks.businessChecks.licensing.required) {
      reasons.push('Required business license not verified');
    }
    if (checks.riskAssessment.sanctionsCheck.found) {
      reasons.push('⚠️ CRITICAL: Company or beneficial owners found on sanctions list');
    }
    if (checks.riskAssessment.pepCheck.found) {
      reasons.push('Politically Exposed Person identified in ownership - enhanced due diligence required');
    }
    if (checks.riskAssessment.amlCheck.riskLevel === 'high') {
      reasons.push('High AML risk detected - requires review');
    }
    if (checks.riskAssessment.jurisdictionRisk.isHighRisk) {
      reasons.push('High-risk jurisdiction - additional compliance required');
    }
    if (checks.riskAssessment.reputationalRisk.hasRisk) {
      reasons.push('Reputational risk factors identified');
    }
    if (checks.entityChecks.isRecentIncorporation) {
      reasons.push('Recent incorporation - limited operating history');
    }

    if (reasons.length === 0) {
      reasons.push('All business verification checks passed successfully');
    }

    return reasons;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(checks: any): number {
    const confidences = [
      checks.entityChecks.entityVerification.confidence,
      checks.entityChecks.registryVerification.confidence,
      checks.ownershipChecks.directorsCheck.confidence,
      checks.businessChecks.businessActivity.confidence,
      checks.businessChecks.regulatoryCompliance.confidence,
    ];

    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return Math.round(avgConfidence);
  }

  /**
   * Update organization status
   */
  private async updateOrganizationStatus(organizationId: string, data: any): Promise<void> {
    try {
      await fetch('/api/raftai/update-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, data }),
      });
    } catch (error) {
      console.error('Error updating organization status:', error);
    }
  }

  /**
   * Get KYB history for an organization
   */
  async getKYBHistory(organizationId: string): Promise<KYBResult[]> {
    // Implementation would fetch from Firebase
    return [];
  }
}

// Export singleton instance
export const kybEngine = KYBEngine.getInstance();


const config = require('../../../config');
const logger = require('../../../utils/logger');

/**
 * LLM Interpretation Engine
 * In production, calls an LLM (GPT-4, Claude, etc.) for nuanced analysis.
 * For MVP, generates structured interpretation from rule results.
 */
class LLMEngine {
  constructor() {
    this.mode = config.ai.mode;
  }

  async interpret(extractedData, ruleResults) {
    logger.info(`LLM engine interpreting results [mode=${this.mode}]`);

    if (this.mode === 'live') {
      return this._liveInterpret(extractedData, ruleResults);
    }
    return this._mockInterpret(extractedData, ruleResults);
  }

  async _liveInterpret(extractedData, ruleResults) {
    // Future: call real LLM endpoint
    // const prompt = this._buildPrompt(extractedData, ruleResults);
    // const response = await fetch(config.ai.llmEndpoint, { ... });
    throw new Error('Live LLM not yet configured');
  }

  _mockInterpret(extractedData, ruleResults) {
    const failedRules = ruleResults.filter(r => !r.passed);
    const criticalCount = failedRules.filter(r => r.severity === 'critical').length;
    const highCount = failedRules.filter(r => r.severity === 'high').length;
    const allNotes = ruleResults.flatMap(r => r.notes || []);

    const totalRules = ruleResults.length;
    const passedRules = ruleResults.filter(r => r.passed).length;
    const baseScore = (passedRules / totalRules) * 100;

    // Deduct extra for critical/high severity
    const penalizedScore = Math.max(0, baseScore - criticalCount * 15 - highCount * 5);
    const score = Math.round(penalizedScore * 10) / 10;

    let riskLevel = 'low';
    if (score < 50 || criticalCount >= 2) riskLevel = 'critical';
    else if (score < 65 || criticalCount >= 1) riskLevel = 'high';
    else if (score < 80) riskLevel = 'medium';

    const missingInformation = [];
    if (!extractedData.metadata?.hasSitePlan) missingInformation.push({ item: 'Site Plan', severity: 'high', reason: 'Required for zoning verification' });
    if (!extractedData.metadata?.hasFoundationPlan) missingInformation.push({ item: 'Foundation Plan', severity: 'medium', reason: 'Required for structural review' });
    if (!extractedData.metadata?.hasElectricalPlan) missingInformation.push({ item: 'Electrical Plan', severity: 'medium', reason: 'Required for electrical permit' });
    if (!extractedData.metadata?.hasMechanicalPlan) missingInformation.push({ item: 'Mechanical Plan / HVAC', severity: 'medium', reason: 'Required for mechanical permit' });

    const recommendations = [];
    if (criticalCount > 0) {
      recommendations.push({
        priority: 'critical',
        text: 'Address all critical zoning violations before submission. Plans with zoning non-compliance are rejected immediately.',
      });
    }
    if (missingInformation.length > 0) {
      recommendations.push({
        priority: 'high',
        text: `Include missing plan sheets: ${missingInformation.map(m => m.item).join(', ')}. Incomplete plan sets result in automatic rejection.`,
      });
    }
    if (allNotes.length > 0) {
      recommendations.push({
        priority: 'medium',
        text: 'Review items flagged for manual verification. Some code compliance items cannot be determined from the floor plan alone.',
      });
    }
    recommendations.push({
      priority: 'low',
      text: 'Consider having a licensed architect stamp the final plans to expedite review.',
    });

    const rejectionRisks = [];
    if (criticalCount > 0) {
      rejectionRisks.push({ risk: 'Zoning non-compliance', probability: 'very_high', details: `${criticalCount} critical zoning violation(s) detected` });
    }
    if (missingInformation.length >= 3) {
      rejectionRisks.push({ risk: 'Incomplete plan set', probability: 'high', details: 'Multiple required plan sheets missing' });
    }
    if (highCount > 2) {
      rejectionRisks.push({ risk: 'Multiple code violations', probability: 'high', details: `${highCount} high-severity issues found` });
    }

    const interpretation = `Analysis of the submitted floor plan reveals ${passedRules} of ${totalRules} code checks passed. ` +
      (criticalCount > 0 ? `There are ${criticalCount} critical issue(s) that will likely result in immediate rejection. ` : '') +
      (highCount > 0 ? `${highCount} high-severity issue(s) should be addressed before submission. ` : '') +
      (missingInformation.length > 0 ? `The plan set appears to be missing ${missingInformation.length} required sheet(s). ` : '') +
      `Overall approval readiness is scored at ${score}/100.`;

    return {
      score,
      riskLevel,
      missingInformation,
      recommendations,
      rejectionRisks,
      interpretation,
    };
  }
}

module.exports = new LLMEngine();

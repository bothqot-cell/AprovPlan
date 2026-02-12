const { query } = require('../../config/db');
const logger = require('../../utils/logger');
const ocrEngine = require('./pipeline/ocrEngine');
const { runRules } = require('./rules/residentialRules');
const llmEngine = require('./engines/llmEngine');

/**
 * Main Analysis Service — orchestrates the full AI pipeline:
 *   1. File Ingestion (upload already handled)
 *   2. OCR / Parsing
 *   3. Rule-based checks
 *   4. LLM interpretation
 *   5. Persist structured results
 */
class AnalysisService {
  async runAnalysis(uploadRecord, user) {
    const startTime = Date.now();
    let analysisId;

    try {
      // Create analysis record
      const insert = await query(
        `INSERT INTO analyses (upload_id, project_id, user_id, status, ai_service_mode, pipeline_version)
         VALUES ($1, $2, $3, 'processing', $4, $5)
         RETURNING id`,
        [uploadRecord.id, uploadRecord.project_id, user.id, require('../../config').ai.mode, '1.0.0']
      );
      analysisId = insert.rows[0].id;

      // Update upload status
      await query('UPDATE uploads SET status = $1 WHERE id = $2', ['processing', uploadRecord.id]);

      // Step 1: OCR extraction
      logger.info(`[Analysis ${analysisId}] Step 1: OCR extraction`);
      const extractedData = await ocrEngine.extract(uploadRecord);

      // Step 2: Rule-based checks
      logger.info(`[Analysis ${analysisId}] Step 2: Rule engine`);
      const ruleResults = runRules(extractedData);

      // Step 3: LLM interpretation
      logger.info(`[Analysis ${analysisId}] Step 3: LLM interpretation`);
      const llmResult = await llmEngine.interpret(extractedData, ruleResults);

      // Build compliance flags from failed rules
      const complianceFlags = ruleResults
        .filter(r => !r.passed)
        .map(r => ({
          ruleId: r.ruleId,
          code: r.code,
          category: r.category,
          description: r.description,
          severity: r.severity,
          violations: r.violations,
        }));

      const processingTime = Date.now() - startTime;

      // Persist results
      await query(
        `UPDATE analyses SET
          approval_readiness_score = $1,
          risk_level = $2,
          compliance_flags = $3,
          missing_information = $4,
          rejection_risks = $5,
          recommendations = $6,
          extracted_data = $7,
          rule_results = $8,
          llm_interpretation = $9,
          processing_time_ms = $10,
          status = 'completed',
          completed_at = NOW()
        WHERE id = $11`,
        [
          llmResult.score,
          llmResult.riskLevel,
          JSON.stringify(complianceFlags),
          JSON.stringify(llmResult.missingInformation),
          JSON.stringify(llmResult.rejectionRisks),
          JSON.stringify(llmResult.recommendations),
          JSON.stringify(extractedData),
          JSON.stringify(ruleResults),
          llmResult.interpretation,
          processingTime,
          analysisId,
        ]
      );

      // Update upload status
      await query('UPDATE uploads SET status = $1 WHERE id = $2', ['analyzed', uploadRecord.id]);

      logger.info(`[Analysis ${analysisId}] Completed in ${processingTime}ms — score: ${llmResult.score}`);
      return analysisId;
    } catch (err) {
      logger.error(`[Analysis ${analysisId || 'N/A'}] Failed: ${err.message}`);

      if (analysisId) {
        await query(
          `UPDATE analyses SET status = 'failed', error_message = $1 WHERE id = $2`,
          [err.message, analysisId]
        );
      }
      await query('UPDATE uploads SET status = $1 WHERE id = $2', ['failed', uploadRecord.id]);

      throw err;
    }
  }
}

module.exports = new AnalysisService();

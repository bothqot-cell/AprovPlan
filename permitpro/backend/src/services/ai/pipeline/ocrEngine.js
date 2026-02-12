const config = require('../../../config');
const logger = require('../../../utils/logger');

/**
 * OCR Engine Abstraction
 * In production, this connects to a real OCR service (Google Vision, AWS Textract, etc.)
 * For MVP, returns mock extracted data simulating what OCR would produce from a floor plan.
 */
class OCREngine {
  constructor() {
    this.mode = config.ai.mode;
  }

  async extract(uploadRecord) {
    logger.info(`OCR engine processing upload ${uploadRecord.id} [mode=${this.mode}]`);

    if (this.mode === 'live') {
      return this._liveExtract(uploadRecord);
    }
    return this._mockExtract(uploadRecord);
  }

  async _liveExtract(uploadRecord) {
    // Future: call real OCR endpoint
    // const response = await fetch(config.ai.ocrEndpoint, { ... });
    throw new Error('Live OCR not yet configured');
  }

  _mockExtract(uploadRecord) {
    return {
      documentType: 'floor_plan',
      pageCount: 3,
      extractedText: [
        'FIRST FLOOR PLAN',
        'Scale: 1/4" = 1\'',
        'Master Bedroom: 14\' x 16\'',
        'Kitchen: 12\' x 14\'',
        'Living Room: 18\' x 20\'',
        'Bathroom 1: 8\' x 10\'',
        'Bathroom 2: 6\' x 8\'',
        'Garage: 20\' x 22\'',
        'Front Setback: 20\'',
        'Side Setback: 5\'',
        'Rear Setback: 15\'',
        'Lot Coverage: 42%',
        'Building Height: 28\'',
      ],
      rooms: [
        { name: 'Master Bedroom', width: 14, length: 16, area: 224 },
        { name: 'Kitchen', width: 12, length: 14, area: 168 },
        { name: 'Living Room', width: 18, length: 20, area: 360 },
        { name: 'Bathroom 1', width: 8, length: 10, area: 80 },
        { name: 'Bathroom 2', width: 6, length: 8, area: 48 },
        { name: 'Garage', width: 20, length: 22, area: 440 },
      ],
      dimensions: {
        totalArea: 2400,
        stories: 2,
        height: 28,
        lotCoverage: 0.42,
      },
      setbacks: {
        front: 20,
        left: 5,
        right: 5,
        rear: 15,
      },
      metadata: {
        scale: '1/4" = 1\'',
        hasElevations: true,
        hasSitePlan: false,
        hasFoundationPlan: false,
        hasElectricalPlan: false,
        hasMechanicalPlan: false,
      },
      confidence: 0.85,
    };
  }
}

module.exports = new OCREngine();

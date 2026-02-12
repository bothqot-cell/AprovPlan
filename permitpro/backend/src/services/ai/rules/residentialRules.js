/**
 * Residential Building Code Rule Engine
 * Based on common IRC (International Residential Code) requirements.
 * Each rule returns a structured result for the compliance report.
 *
 * In production, rules would be jurisdiction-specific and loaded dynamically.
 */

const rules = [
  {
    id: 'MIN_ROOM_SIZE',
    code: 'IRC R304.1',
    category: 'Room Dimensions',
    description: 'Habitable rooms must have a minimum area of 70 sq ft',
    severity: 'high',
    check: (data) => {
      const violations = [];
      for (const room of data.rooms || []) {
        if (['Bathroom', 'Garage', 'Closet', 'Hallway'].some(t => room.name.includes(t))) continue;
        if (room.area < 70) {
          violations.push(`${room.name} is ${room.area} sq ft (minimum 70 sq ft required)`);
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'MIN_BEDROOM_SIZE',
    code: 'IRC R304.2',
    category: 'Room Dimensions',
    description: 'At least one bedroom must have a minimum area of 120 sq ft',
    severity: 'high',
    check: (data) => {
      const bedrooms = (data.rooms || []).filter(r => r.name.toLowerCase().includes('bedroom'));
      const hasLargeBedroom = bedrooms.some(b => b.area >= 120);
      return {
        passed: hasLargeBedroom,
        violations: hasLargeBedroom ? [] : ['No bedroom meets the 120 sq ft minimum for a primary bedroom'],
      };
    },
  },
  {
    id: 'MIN_CEILING_HEIGHT',
    code: 'IRC R305.1',
    category: 'Room Dimensions',
    description: 'Habitable rooms require minimum 7ft ceiling height',
    severity: 'medium',
    check: (data) => {
      // OCR would extract ceiling height; check if present
      return {
        passed: true,
        violations: [],
        notes: ['Ceiling height not explicitly specified in extracted data — verify on plans'],
      };
    },
  },
  {
    id: 'SETBACK_FRONT',
    code: 'ZONING',
    category: 'Setbacks',
    description: 'Front setback must meet zoning minimum (typically 20ft for residential)',
    severity: 'critical',
    check: (data) => {
      const front = data.setbacks?.front;
      if (front === undefined) {
        return { passed: false, violations: ['Front setback not specified'] };
      }
      return {
        passed: front >= 20,
        violations: front < 20 ? [`Front setback is ${front}ft (minimum 20ft required)`] : [],
      };
    },
  },
  {
    id: 'SETBACK_SIDE',
    code: 'ZONING',
    category: 'Setbacks',
    description: 'Side setbacks must meet zoning minimum (typically 5ft)',
    severity: 'critical',
    check: (data) => {
      const violations = [];
      const left = data.setbacks?.left;
      const right = data.setbacks?.right;
      if (left !== undefined && left < 5) violations.push(`Left side setback is ${left}ft (minimum 5ft)`);
      if (right !== undefined && right < 5) violations.push(`Right side setback is ${right}ft (minimum 5ft)`);
      if (left === undefined) violations.push('Left side setback not specified');
      if (right === undefined) violations.push('Right side setback not specified');
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'SETBACK_REAR',
    code: 'ZONING',
    category: 'Setbacks',
    description: 'Rear setback must meet zoning minimum (typically 10ft)',
    severity: 'high',
    check: (data) => {
      const rear = data.setbacks?.rear;
      if (rear === undefined) {
        return { passed: false, violations: ['Rear setback not specified'] };
      }
      return {
        passed: rear >= 10,
        violations: rear < 10 ? [`Rear setback is ${rear}ft (minimum 10ft required)`] : [],
      };
    },
  },
  {
    id: 'LOT_COVERAGE',
    code: 'ZONING',
    category: 'Site Coverage',
    description: 'Lot coverage must not exceed maximum (typically 50%)',
    severity: 'high',
    check: (data) => {
      const coverage = data.dimensions?.lotCoverage;
      if (coverage === undefined) {
        return { passed: false, violations: ['Lot coverage percentage not specified'] };
      }
      return {
        passed: coverage <= 0.50,
        violations: coverage > 0.50 ? [`Lot coverage is ${(coverage * 100).toFixed(0)}% (maximum 50%)`] : [],
      };
    },
  },
  {
    id: 'BUILDING_HEIGHT',
    code: 'IRC R301.3 / ZONING',
    category: 'Height',
    description: 'Building height must not exceed maximum (typically 35ft for residential)',
    severity: 'critical',
    check: (data) => {
      const height = data.dimensions?.height;
      if (height === undefined) {
        return { passed: false, violations: ['Building height not specified'] };
      }
      return {
        passed: height <= 35,
        violations: height > 35 ? [`Building height is ${height}ft (maximum 35ft)`] : [],
      };
    },
  },
  {
    id: 'BATHROOM_MIN_SIZE',
    code: 'IRC P2705',
    category: 'Room Dimensions',
    description: 'Bathrooms require minimum 30 sq ft',
    severity: 'medium',
    check: (data) => {
      const bathrooms = (data.rooms || []).filter(r => r.name.toLowerCase().includes('bathroom'));
      const violations = bathrooms
        .filter(b => b.area < 30)
        .map(b => `${b.name} is ${b.area} sq ft (minimum 30 sq ft)`);
      return { passed: violations.length === 0, violations };
    },
  },
  {
    id: 'EGRESS_WINDOW',
    code: 'IRC R310.1',
    category: 'Safety',
    description: 'Sleeping rooms require emergency egress windows',
    severity: 'high',
    check: (data) => {
      // Cannot fully verify from floor plan OCR alone
      return {
        passed: true,
        violations: [],
        notes: ['Egress window compliance cannot be fully verified from floor plan — verify window schedules'],
      };
    },
  },
];

function runRules(extractedData) {
  return rules.map((rule) => {
    const result = rule.check(extractedData);
    return {
      ruleId: rule.id,
      code: rule.code,
      category: rule.category,
      description: rule.description,
      severity: rule.severity,
      passed: result.passed,
      violations: result.violations || [],
      notes: result.notes || [],
    };
  });
}

module.exports = { rules, runRules };

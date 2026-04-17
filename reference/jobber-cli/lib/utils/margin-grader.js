/**
 * Purpose: Margin Grader - grades profit margins with color-coded labels
 * Inputs: Margin percentages (Net Retained and True Profit)
 * Outputs: Grade labels and styling classes
 * Dependencies: None
 */

/**
 * Margin grade thresholds and styling
 */
export const MARGIN_GRADES = {
  EPIC: {
    threshold: 70,
    label: 'Epic',
    color: '#10b981', // bright green
    bgColor: '#d1fae5',
    badgeClass: 'grade-epic'
  },
  VERY_GOOD: {
    threshold: 65,
    label: 'Very Good',
    color: '#059669', // green
    bgColor: '#d1fae5',
    badgeClass: 'grade-very-good'
  },
  GOOD: {
    threshold: 60,
    label: 'Good',
    color: '#14b8a6', // teal
    bgColor: '#ccfbf1',
    badgeClass: 'grade-good'
  },
  NEEDS_INSPECTION: {
    threshold: 50,
    label: 'Needs Inspection',
    color: '#f59e0b', // amber
    bgColor: '#fef3c7',
    badgeClass: 'grade-needs-inspection'
  },
  FLAGGED: {
    threshold: -Infinity,
    label: 'Flagged for Review',
    color: '#ef4444', // red
    bgColor: '#fee2e2',
    badgeClass: 'grade-flagged'
  }
};

/**
 * Grade a margin percentage
 * @param {number} marginPercent - Margin percentage (0-100)
 * @returns {Object} Grade information with label, color, and badge class
 */
export function gradeMargin(marginPercent) {
  if (!Number.isFinite(marginPercent)) {
    return {
      ...MARGIN_GRADES.FLAGGED,
      percent: 0,
      formattedPercent: '0.0%',
      displayLabel: '0.0% • Flagged for Review'
    };
  }
  
  let grade;
  
  if (marginPercent >= MARGIN_GRADES.EPIC.threshold) {
    grade = MARGIN_GRADES.EPIC;
  } else if (marginPercent >= MARGIN_GRADES.VERY_GOOD.threshold) {
    grade = MARGIN_GRADES.VERY_GOOD;
  } else if (marginPercent >= MARGIN_GRADES.GOOD.threshold) {
    grade = MARGIN_GRADES.GOOD;
  } else if (marginPercent >= MARGIN_GRADES.NEEDS_INSPECTION.threshold) {
    grade = MARGIN_GRADES.NEEDS_INSPECTION;
  } else {
    grade = MARGIN_GRADES.FLAGGED;
  }
  
  const formattedPercent = `${marginPercent.toFixed(1)}%`;
  const displayLabel = `${formattedPercent} • ${grade.label}`;
  
  return {
    ...grade,
    percent: marginPercent,
    formattedPercent,
    displayLabel
  };
}

/**
 * Get CSS styles for grade badges
 * @returns {string} CSS styles
 */
export function getGradeCSS() {
  return `
    .grade-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .grade-epic {
      color: ${MARGIN_GRADES.EPIC.color};
      background-color: ${MARGIN_GRADES.EPIC.bgColor};
      border: 1px solid ${MARGIN_GRADES.EPIC.color};
    }
    
    .grade-very-good {
      color: ${MARGIN_GRADES.VERY_GOOD.color};
      background-color: ${MARGIN_GRADES.VERY_GOOD.bgColor};
      border: 1px solid ${MARGIN_GRADES.VERY_GOOD.color};
    }
    
    .grade-good {
      color: ${MARGIN_GRADES.GOOD.color};
      background-color: ${MARGIN_GRADES.GOOD.bgColor};
      border: 1px solid ${MARGIN_GRADES.GOOD.color};
    }
    
    .grade-needs-inspection {
      color: ${MARGIN_GRADES.NEEDS_INSPECTION.color};
      background-color: ${MARGIN_GRADES.NEEDS_INSPECTION.bgColor};
      border: 1px solid ${MARGIN_GRADES.NEEDS_INSPECTION.color};
    }
    
    .grade-flagged {
      color: ${MARGIN_GRADES.FLAGGED.color};
      background-color: ${MARGIN_GRADES.FLAGGED.bgColor};
      border: 1px solid ${MARGIN_GRADES.FLAGGED.color};
    }
  `;
}


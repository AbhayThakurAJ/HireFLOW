/**
 * Rule-based lead scoring engine.
 * Scores leads from 0-100 based on source, completeness, and inferred authority.
 */
export const calculateLeadScore = (leadData) => {
  let score = 0;

  // 1. Source Weighting
  switch (leadData.source) {
    case 'REFERRAL':
      score += 30;
      break;
    case 'WEBSITE':
    case 'LINKEDIN':
      score += 20;
      break;
    case 'ADVERTISEMENT':
      score += 15;
      break;
    case 'EMAIL':
    case 'COLD_CALL':
      score += 10;
      break;
    default:
      score += 5;
  }

  // 2. Data Completeness
  if (leadData.email) score += 10;
  if (leadData.phone) score += 10;
  if (leadData.company) score += 10;

  // 3. Inferred Authority from Job Title
  if (leadData.jobTitle) {
    const title = leadData.jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('founder') || title.includes('president') || title.includes('owner')) {
      score += 25;
    } else if (title.includes('vp') || title.includes('director') || title.includes('head')) {
      score += 15;
    } else if (title.includes('manager')) {
      score += 5;
    }
  }

  // Cap score between 0 and 100
  return Math.min(100, Math.max(0, score));
};

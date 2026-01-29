interface Review {
  rating_overall: number;
  metrics?: {
    deadlines?: number;
    quality?: number;
    communication?: number;
    teamwork?: number;
    professionalism?: number;
    problem_solving?: number;
  };
  would_work_again?: boolean;
  flags?: {
    toxic?: boolean;
    abandoned?: boolean;
    broken_rules?: boolean;
  };
}

interface UserProfile {
  id: string;
  roles?: string[];
}

export interface MatchScore {
  total: number;
  breakdown: {
    skillMatch: number;      // 40%
    reputation: number;      // 30%
    reliability: number;     // 20%
    compatibility: number;   // 10%
  };
  penalties: {
    toxicFlag: boolean;
    abandonedFlag: boolean;
  };
  averageRating: number;
}

const avgMetric = (reviews: Review[], metricKey: keyof NonNullable<Review['metrics']>): number => {
  const values = reviews
    .map(r => r.metrics?.[metricKey])
    .filter((v): v is number => typeof v === 'number');
  
  if (values.length === 0) return 3; // Default to middle value
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export function calculateMatchScore(
  user: UserProfile,
  userReviews: Review[],
  requiredSkills: string[]
): MatchScore {
  const userSkills = user.roles || [];
  
  // Skill Match (40%)
  let skillScore = 0;
  if (requiredSkills.length > 0) {
    const matchedSkills = requiredSkills.filter(s => 
      userSkills.some(us => us.toLowerCase() === s.toLowerCase())
    );
    skillScore = (matchedSkills.length / requiredSkills.length) * 40;
  } else {
    skillScore = 20; // Default to half if no skills specified
  }

  // Reputation (30%) - average of rating_overall
  const avgRating = userReviews.length > 0 
    ? userReviews.reduce((sum, r) => sum + r.rating_overall, 0) / userReviews.length
    : 3; // default medium
  const reputationScore = (avgRating / 5) * 30;

  // Reliability (20%) - average of deadlines metric
  const deadlinesAvg = avgMetric(userReviews, 'deadlines');
  const reliabilityScore = (deadlinesAvg / 5) * 20;

  // Compatibility (10%) - % would_work_again
  const wouldWorkAgainCount = userReviews.filter(r => r.would_work_again === true).length;
  const compatibilityScore = userReviews.length > 0
    ? (wouldWorkAgainCount / userReviews.length) * 10
    : 5; // Default to half

  // Penalties for flags
  const hasToxicFlag = userReviews.some(r => r.flags?.toxic === true);
  const hasAbandonedFlag = userReviews.some(r => r.flags?.abandoned === true);
  
  let total = skillScore + reputationScore + reliabilityScore + compatibilityScore;
  
  // Severe penalty for flags
  if (hasToxicFlag) total -= 50;
  if (hasAbandonedFlag) total -= 30;

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown: { 
      skillMatch: skillScore, 
      reputation: reputationScore, 
      reliability: reliabilityScore, 
      compatibility: compatibilityScore 
    },
    penalties: { 
      toxicFlag: hasToxicFlag, 
      abandonedFlag: hasAbandonedFlag 
    },
    averageRating: avgRating,
  };
}

// Sort users by match score
export function sortByMatchScore<T extends { id: string; roles?: string[] }>(
  users: T[],
  reviewsByUser: Map<string, Review[]>,
  requiredSkills: string[]
): (T & { matchScore: MatchScore })[] {
  return users
    .map(user => ({
      ...user,
      matchScore: calculateMatchScore(
        { id: user.id, roles: user.roles },
        reviewsByUser.get(user.id) || [],
        requiredSkills
      )
    }))
    .sort((a, b) => b.matchScore.total - a.matchScore.total);
}

// Subscription tier reference built from https://moltsets.com/pricing
export interface PlanTier {
  id: string;
  name: string;
  price: string;
  enrichRecords5h: number;
  searchRecords5h: number;
  concurrency: number;
  personalEmail: boolean;
  highlight?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  { id: 'free', name: 'Free', price: '$0', enrichRecords5h: 1000, searchRecords5h: 100, concurrency: 3, personalEmail: true },
  { id: 'subscription_27', name: 'Solo', price: '$27/mo', enrichRecords5h: 1000, searchRecords5h: 500, concurrency: 3, personalEmail: true },
  { id: 'subscription_97', name: 'Pro', price: '$97/mo', enrichRecords5h: 15000, searchRecords5h: 7500, concurrency: 5, personalEmail: true, highlight: true },
  { id: 'subscription_397', name: 'Team', price: '$397/mo', enrichRecords5h: 150000, searchRecords5h: 75000, concurrency: 8, personalEmail: false },
  { id: 'subscription_997', name: 'Max', price: '$997/mo', enrichRecords5h: 225000, searchRecords5h: 112500, concurrency: 8, personalEmail: false },
];

export function planName(plan: string | null | undefined): string {
  if (!plan) return '—';
  const t = PLAN_TIERS.find((p) => p.id === plan);
  return t ? `${t.name} (${t.price})` : plan;
}

// Library catalog — curated mirror of https://moltsets.com/library
export interface LibrarySkill {
  title: string;
  category: 'Enrichment' | 'Prospecting' | 'Ad Audience' | 'IP Intelligence';
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  outcome: string;
  platforms: string[];
  description: string;
}

export const LIBRARY_CATEGORIES = ['Enrichment', 'Prospecting', 'Ad Audience', 'IP Intelligence'] as const;
export const LIBRARY_DIFFICULTIES = ['Easy', 'Intermediate', 'Advanced'] as const;

export const LIBRARY_SKILLS: LibrarySkill[] = [
  { title: 'Email Finder', category: 'Enrichment', difficulty: 'Easy', outcome: 'Get verified emails', platforms: ['CSV', 'Excel'], description: 'The flagship skill: resolve any name + company into a verified business email with an A–F deliverability risk grade.' },
  { title: 'Mobile Number Finder', category: 'Enrichment', difficulty: 'Easy', outcome: 'Get verified emails & mobile phone numbers', platforms: ['CSV', 'Google Sheets'], description: 'Pull carrier-verified mobile phones from LinkedIn URLs using phone tokens — one token per number found, nothing on a miss.' },
  { title: 'Bulk LinkedIn Enrichment', category: 'Enrichment', difficulty: 'Intermediate', outcome: 'Get verified emails', platforms: ['Excel', 'HubSpot'], description: 'Batch-enrich up to 100 LinkedIn URLs per call into best / business / personal emails.' },
  { title: 'Reverse Email Identity', category: 'Enrichment', difficulty: 'Easy', outcome: 'Turn emails into full identities', platforms: ['CSV', 'Google Sheets'], description: 'Turn any email into a name, title, seniority, company and revenue band — the fastest path from inbox to persona.' },
  { title: 'ICP Lead List Builder', category: 'Prospecting', difficulty: 'Intermediate', outcome: 'Find new prospects', platforms: ['CSV', 'HubSpot'], description: 'Combine title, seniority, industry, employee and revenue filters to build tightly targeted outbound lead lists.' },
  { title: 'Decision Maker Radar', category: 'Prospecting', difficulty: 'Advanced', outcome: 'Find decision makers at target accounts', platforms: ['HubSpot', 'CSV'], description: 'Stack C-suite + department + suppression-list filters to surface only the buyers that matter at named accounts.' },
  { title: 'Company Account Qualifier', category: 'Prospecting', difficulty: 'Easy', outcome: 'Qualify target accounts', platforms: ['Excel', 'Google Sheets'], description: 'Search the company database by domain, industry, size and revenue to qualify ABM target lists.' },
  { title: 'NAICS Precision Targeting', category: 'Prospecting', difficulty: 'Advanced', outcome: 'Niche industry targeting', platforms: ['CSV'], description: 'Use 2–6 digit NAICS codes for the most standardised, fine-grained industry targeting available.' },
  { title: 'Meta Custom Audience', category: 'Ad Audience', difficulty: 'Intermediate', outcome: 'Build ad audiences', platforms: ['Meta', 'CSV'], description: 'Hash business emails to SHA256 and upload them as custom audiences on Meta.' },
  { title: 'Google Customer Match', category: 'Ad Audience', difficulty: 'Intermediate', outcome: 'Build ad audiences', platforms: ['Google', 'CSV'], description: 'SHA256-hashed email lists formatted for Google Ads Customer Match upload.' },
  { title: 'TikTok Audience Builder', category: 'Ad Audience', difficulty: 'Intermediate', outcome: 'Build ad audiences', platforms: ['TikTok', 'CSV'], description: 'Turn LinkedIn profiles and emails into hashed identifiers ready for TikTok custom audiences.' },
  { title: 'MAID Device Matcher', category: 'Ad Audience', difficulty: 'Advanced', outcome: 'Mobile advertising IDs', platforms: ['CSV'], description: 'Match emails to Mobile Advertising IDs (AAID / IDFA) to reach users across mobile DSPs.' },
  { title: 'Website Visitor to Pipeline', category: 'IP Intelligence', difficulty: 'Intermediate', outcome: 'Turn website visitors into pipeline', platforms: ['RB2B', 'HubSpot'], description: 'Resolve visitor IP addresses into companies and route them straight into your CRM.' },
  { title: 'IP to Company Alerting', category: 'IP Intelligence', difficulty: 'Advanced', outcome: 'Realtime visitor intelligence', platforms: ['Webhooks', 'CSV'], description: 'Wire ip_to_company into your stack to alert sales the moment a target account lands on your site.' },
];

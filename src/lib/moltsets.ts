// Central registry of all MoltSets API tools, built from the official docs:
// https://developer.moltsets.com/llms.txt

export type ParamType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'number'
  | 'switch';

export interface ToolParam {
  name: string;
  label: string;
  type: ParamType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean;
}

export interface MoltTool {
  id: string; // API tool path e.g. search_people
  name: string;
  category: ToolCategory;
  icon: string;
  description: string;
  docs: string;
  inputMode: 'form' | 'linkedin' | 'email' | 'linkedin_email' | 'ip' | 'none';
  supportsBatch?: boolean; // accepts e.g. linkedin_urls (max 100)
  batchField?: string; // e.g. linkedin_urls
  singleField?: string; // e.g. linkedin_url
  batchMax?: number;
  planGate?: string; // note about tier gating
  metered?: string; // e.g. phone tokens
  countOnlyFree?: boolean;
  params: ToolParam[];
}

export type ToolCategory =
  | 'Search'
  | 'Get Valid Emails'
  | 'Mobile Phones'
  | 'Reverse Lookups'
  | 'Ad Audience'
  | 'Get LinkedIn'
  | 'Get Company'
  | 'Account';

export const CATEGORIES: ToolCategory[] = [
  'Search',
  'Get Valid Emails',
  'Mobile Phones',
  'Reverse Lookups',
  'Ad Audience',
  'Get LinkedIn',
  'Get Company',
  'Account',
];

export const SENIORITY_OPTIONS = [
  'Intern', 'Entry', 'Senior', 'Manager', 'Director', 'VP', 'Head', 'C Suite', 'Owner', 'Partner',
];

export const INDUSTRY_OPTIONS = [
  'Professional and Business Services', 'Information Technology', 'Manufacturing', 'Retail',
  'Health and Pharmaceuticals', 'Creative Arts and Entertainment', 'Construction',
  'Marketing & Advertising', 'Finance and Banking', 'Tourism and Hospitality',
  'Non-Profit and Social Services', 'Food and Beverage', 'Real Estate', 'Education',
  'Transportation and Logistics', 'Media and Publishing', 'Energy',
  'Government and Public Administration', 'Automotive', 'Telecommunications', 'Agriculture',
  'Utilities',
];

export const DEPARTMENT_OPTIONS = [
  'Operations', 'Sales', 'Information Technology', 'Education', 'Engineering', 'Finance',
  'Medical & Health', 'Marketing', 'Human Resources', 'Design', 'Consulting', 'Legal',
];

export const EMPLOYEE_RANGE_OPTIONS = [
  '1-10', '11-20', '21-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+',
];

export const REVENUE_RANGE_OPTIONS = [
  'Below $500k', '$500k - $1M', '$1M - $5M', '$5M - $10M', '$10M - $20M', '$20M - $50M', 'Above $50M',
];

export const TOP_COUNTRIES = [
  'United States', 'India', 'United Kingdom', 'Brazil', 'Canada', 'France', 'Mexico', 'Australia',
  'China', 'Spain', 'Netherlands', 'Italy', 'Indonesia', 'Germany', 'Philippines', 'Turkey',
  'South Africa', 'Saudi Arabia', 'Argentina', 'Singapore', 'United Arab Emirates', 'Colombia',
  'South Korea', 'Malaysia', 'Poland', 'Belgium', 'Switzerland', 'Ireland', 'Sweden', 'Denmark',
  'Norway', 'Austria', 'Portugal', 'Israel', 'New Zealand', 'Finland', 'Greece', 'Hungary',
  'Romania', 'Ukraine',
];

const LIMIT_PARAM: ToolParam = {
  name: 'limit', label: 'Limit', type: 'number', min: 1, max: 25, defaultValue: 10,
  help: 'Results per page (1-25, default 10)',
};
const OFFSET_PARAM: ToolParam = {
  name: 'offset', label: 'Offset', type: 'number', min: 0, defaultValue: 0,
  help: 'Pagination offset',
};

export const TOOLS: MoltTool[] = [
  // ============ SEARCH ============
  {
    id: 'search_people',
    name: 'Search for People',
    category: 'Search',
    icon: 'TeamOutlined',
    description:
      "Search MoltSets' contact database by name, job title, company, industry, country, seniority, or department. Lists are OR within a field, AND across fields. Results are ranked by _score.",
    docs: 'https://developer.moltsets.com/api-reference/search/search-for-people',
    inputMode: 'form',
    params: [
      { name: 'query', label: 'Query (name / phrase)', type: 'text', placeholder: 'Jane Doe', help: 'Full-text across name, company, title, headline. For roles use the Title filter instead.' },
      { name: 'title', label: 'Job Title', type: 'textarea', placeholder: 'Account Executive\n(OR list — one per line)' },
      { name: 'company', label: 'Company Name', type: 'textarea', placeholder: 'MoltSets\n(one per line)' },
      { name: 'company_domain', label: 'Company Domain', type: 'textarea', placeholder: 'moltsets.com\n(one per line, max 100)' },
      { name: 'country', label: 'Country', type: 'multiselect', options: TOP_COUNTRIES, help: 'Exact match. Most reliable filter (~99% filled).' },
      { name: 'state', label: 'State / Region', type: 'textarea', placeholder: 'Texas / TX / Ontario' },
      { name: 'city', label: 'City', type: 'textarea', placeholder: 'Austin' },
      { name: 'seniority', label: 'Seniority', type: 'multiselect', options: SENIORITY_OPTIONS },
      { name: 'industry', label: 'Industry (22 buckets)', type: 'multiselect', options: INDUSTRY_OPTIONS },
      { name: 'department', label: 'Department', type: 'multiselect', options: DEPARTMENT_OPTIONS, help: 'Shares data with functional_area — use one, not both.' },
      { name: 'functional_area', label: 'Functional Area', type: 'multiselect', options: DEPARTMENT_OPTIONS },
      { name: 'employee_range', label: 'Employee Range (employer)', type: 'multiselect', options: EMPLOYEE_RANGE_OPTIONS },
      { name: 'revenue_range', label: 'Revenue Range (employer)', type: 'multiselect', options: REVENUE_RANGE_OPTIONS },
      { name: 'naics_code', label: 'NAICS Code', type: 'textarea', placeholder: '511210 / 54 / 5411', help: 'Any hierarchy level: 2-digit sector up to 6-digit national industry.' },
      { name: 'linkedin_industry', label: 'LinkedIn Industry (employer)', type: 'textarea', placeholder: 'Software Development' },
      { name: 'exclude_company_domain', label: 'Exclude Domains (suppression)', type: 'textarea', placeholder: 'acme.com\nstripe.com', help: 'Drop people at these companies — costs no records.' },
      { name: 'exclude_country', label: 'Exclude Countries', type: 'textarea', placeholder: 'India\nPhilippines' },
      { name: 'exclude_state', label: 'Exclude States', type: 'textarea', placeholder: 'California\nNew York' },
      { name: 'exclude_industry', label: 'Exclude Industries', type: 'textarea' },
      { name: 'exclude_seniority', label: 'Exclude Seniority', type: 'multiselect', options: SENIORITY_OPTIONS },
      { name: 'exclude_employee_range', label: 'Exclude Employee Ranges', type: 'multiselect', options: EMPLOYEE_RANGE_OPTIONS },
      LIMIT_PARAM,
      OFFSET_PARAM,
    ],
  },
  {
    id: 'search_companies',
    name: 'Search for Companies',
    category: 'Search',
    icon: 'BankOutlined',
    description:
      "Search MoltSets' company database by name, domain, industry, employee count, or annual revenue to find and qualify target accounts.",
    docs: 'https://developer.moltsets.com/api-reference/search/search-for-companies',
    inputMode: 'form',
    params: [
      { name: 'query', label: 'Query (company name)', type: 'text', placeholder: 'Acme' },
      { name: 'domain', label: 'Domain', type: 'textarea', placeholder: 'acme.com\n(one per line, max 100)' },
      { name: 'industry', label: 'Industry', type: 'multiselect', options: INDUSTRY_OPTIONS },
      { name: 'employee_range', label: 'Employee Range', type: 'multiselect', options: EMPLOYEE_RANGE_OPTIONS },
      { name: 'revenue_range', label: 'Revenue Range', type: 'multiselect', options: REVENUE_RANGE_OPTIONS },
      { name: 'naics_code', label: 'NAICS Code', type: 'textarea', placeholder: '511210' },
      { name: 'linkedin_industry', label: 'LinkedIn Industry', type: 'textarea', placeholder: 'Software Development' },
      { name: 'country', label: 'Country', type: 'multiselect', options: TOP_COUNTRIES },
      { name: 'state', label: 'State / Region', type: 'textarea', placeholder: 'California' },
      { name: 'exclude_domain', label: 'Exclude Domains', type: 'textarea', placeholder: 'acme.com' },
      { name: 'exclude_industry', label: 'Exclude Industries', type: 'multiselect', options: INDUSTRY_OPTIONS },
      { name: 'exclude_employee_range', label: 'Exclude Employee Ranges', type: 'multiselect', options: EMPLOYEE_RANGE_OPTIONS },
      { name: 'exclude_revenue_range', label: 'Exclude Revenue Ranges', type: 'multiselect', options: REVENUE_RANGE_OPTIONS },
      LIMIT_PARAM,
      OFFSET_PARAM,
    ],
  },
  {
    id: 'search_linkedin_profile',
    name: 'Search LinkedIn Profile',
    category: 'Search',
    icon: 'LinkedinOutlined',
    description:
      'Find LinkedIn profile URLs by person name and company. Use count_only for a free count of matches without spending tokens.',
    docs: 'https://developer.moltsets.com/api-reference/search/search-for-linkedin-profile',
    inputMode: 'form',
    countOnlyFree: true,
    params: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith', help: 'Parsed into first + last automatically' },
      { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'John', help: 'Used when name is not provided' },
      { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Smith' },
      { name: 'company', label: 'Company (domain or URL)', type: 'text', placeholder: 'acme.com' },
      { name: 'company_domain', label: 'Company Domain (alias)', type: 'text', placeholder: 'acme.com' },
      { name: 'count_only', label: 'Count Only (free)', type: 'switch', defaultValue: false, help: 'Returns match count without charging tokens' },
    ],
  },
  {
    id: 'search_business_email_by_name',
    name: 'Search Business Email by Name',
    category: 'Search',
    icon: 'MailOutlined',
    description: 'Find a verified business email (with A–F risk grade) from a person name plus company domain.',
    docs: 'https://developer.moltsets.com/api-reference/search/search-business-email-by-name',
    inputMode: 'form',
    params: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
      { name: 'first_name', label: 'First Name', type: 'text', placeholder: 'John' },
      { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Smith' },
      { name: 'company', label: 'Company (domain or URL)', type: 'text', placeholder: 'acme.com' },
      { name: 'company_domain', label: 'Company Domain (alias)', type: 'text', placeholder: 'acme.com' },
    ],
  },
  {
    id: 'search_business_profile_by_name',
    name: 'Search Business Profile by Name',
    category: 'Search',
    icon: 'IdcardOutlined',
    description: 'Retrieve a person\'s full business profile from name plus company domain.',
    docs: 'https://developer.moltsets.com/api-reference/search/search-business-profile-by-name',
    inputMode: 'form',
    params: [
      { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
      { name: 'first_name', label: 'First Name', type: 'text' },
      { name: 'last_name', label: 'Last Name', type: 'text' },
      { name: 'company', label: 'Company (domain or URL)', type: 'text', placeholder: 'acme.com' },
      { name: 'company_domain', label: 'Company Domain (alias)', type: 'text' },
    ],
  },

  // ============ GET VALID EMAILS ============
  {
    id: 'linkedin_to_best_email',
    name: 'LinkedIn → Best Email',
    category: 'Get Valid Emails',
    icon: 'MailOutlined',
    description: 'Get the best verified email (business or personal) for a LinkedIn profile, with A–F deliverability risk grade.',
    docs: 'https://developer.moltsets.com/api-reference/get-valid-emails/linkedin-to-best-email',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    params: [],
  },
  {
    id: 'linkedin_to_business_email',
    name: 'LinkedIn → Business Email',
    category: 'Get Valid Emails',
    icon: 'MailOutlined',
    description: 'Resolve a LinkedIn profile to their verified business email with risk grade.',
    docs: 'https://developer.moltsets.com/api-reference/get-valid-emails/linkedin-to-business-email',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    params: [],
  },
  {
    id: 'linkedin_to_personal_email_usa',
    name: 'LinkedIn → Personal Email (US)',
    category: 'Get Valid Emails',
    icon: 'MailOutlined',
    description: 'US-only personal email lookup. Requires personal-email entitlement on your plan.',
    docs: 'https://developer.moltsets.com/api-reference/get-valid-emails/linkedin-to-personal-email-us-only',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    planGate: 'personal_email_available',
    params: [],
  },
  {
    id: 'linkedin_to_best_personal_email_usa',
    name: 'LinkedIn → Best Personal Email (US)',
    category: 'Get Valid Emails',
    icon: 'MailOutlined',
    description: 'US-only best personal email lookup. Requires personal-email entitlement on your plan.',
    docs: 'https://developer.moltsets.com/api-reference/get-valid-emails/linkedin-to-best-personal-email-us-only',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    planGate: 'personal_email_available',
    params: [],
  },

  // ============ MOBILE PHONES ============
  {
    id: 'linkedin_to_mobile_phone',
    name: 'LinkedIn → Mobile Phone',
    category: 'Mobile Phones',
    icon: 'PhoneOutlined',
    description: 'Get a carrier-verified mobile phone number for a LinkedIn profile. Metered with phone tokens — one token per number found, nothing on a miss.',
    docs: 'https://developer.moltsets.com/api-reference/get-carrier-verified-mobile-phones/linkedin-to-mobile-phone',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    metered: 'phone_tokens',
    params: [],
  },

  // ============ REVERSE LOOKUPS ============
  {
    id: 'reverse_email_lookup',
    name: 'Reverse Email Lookup',
    category: 'Reverse Lookups',
    icon: 'SearchOutlined',
    description: 'Turn an email into a full identity: name, title, seniority, company, revenue band, confirmed work email, personal emails with risk grades.',
    docs: 'https://developer.moltsets.com/api-reference/reverse-lookups/reverse-email-lookup',
    inputMode: 'email',
    supportsBatch: true,
    batchField: 'emails',
    singleField: 'email',
    batchMax: 100,
    params: [],
  },
  {
    id: 'reverse_linkedin_lookup',
    name: 'Reverse LinkedIn Lookup',
    category: 'Reverse Lookups',
    icon: 'SearchOutlined',
    description: 'Turn a LinkedIn profile URL into the full identity and employment record.',
    docs: 'https://developer.moltsets.com/api-reference/reverse-lookups/reverse-linkedin-lookup',
    inputMode: 'linkedin',
    supportsBatch: true,
    batchField: 'linkedin_urls',
    singleField: 'linkedin_url',
    batchMax: 100,
    params: [],
  },

  // ============ AD AUDIENCE ============
  {
    id: 'email_to_maid',
    name: 'Email → MAID',
    category: 'Ad Audience',
    icon: 'MobileOutlined',
    description: 'Match an email to Mobile Advertising IDs (AAID/IDFA) for mobile ad audiences.',
    docs: 'https://developer.moltsets.com/api-reference/get-ad-audience/email-to-maid',
    inputMode: 'email',
    params: [],
  },
  {
    id: 'business_email_to_sha256',
    name: 'Business Email → SHA256',
    category: 'Ad Audience',
    icon: 'SafetyOutlined',
    description: 'Hash a business email to SHA256 for matching on Meta, Google and TikTok ad platforms.',
    docs: 'https://developer.moltsets.com/api-reference/get-ad-audience/business-email-to-sha256',
    inputMode: 'email',
    params: [],
  },
  {
    id: 'linkedin_to_sha256',
    name: 'LinkedIn → SHA256',
    category: 'Ad Audience',
    icon: 'SafetyOutlined',
    description: 'Hash a LinkedIn identity to SHA256 for ad-platform custom audiences.',
    docs: 'https://developer.moltsets.com/api-reference/get-ad-audience/linkedin-to-sha256',
    inputMode: 'linkedin',
    params: [],
  },

  // ============ GET LINKEDIN ============
  {
    id: 'email_to_linkedin',
    name: 'Email → LinkedIn',
    category: 'Get LinkedIn',
    icon: 'LinkedinOutlined',
    description: 'Resolve an email address to its LinkedIn profile URL.',
    docs: 'https://developer.moltsets.com/api-reference/get-linkedin/email-to-linkedin',
    inputMode: 'email',
    params: [],
  },

  // ============ GET COMPANY ============
  {
    id: 'ip_to_company',
    name: 'IP → Company',
    category: 'Get Company',
    icon: 'GlobalOutlined',
    description: 'Identify the company behind an IP address — turn website visitors into pipeline contacts.',
    docs: 'https://developer.moltsets.com/api-reference/get-company/ip-to-company',
    inputMode: 'ip',
    params: [],
  },

  // ============ ACCOUNT ============
  {
    id: 'get_account',
    name: 'Get Account',
    category: 'Account',
    icon: 'UserOutlined',
    description: 'Account details: name, plan, status, credit balance, Fair Use standing, phone tokens, personal-email entitlement, API key and user counts.',
    docs: 'https://developer.moltsets.com/api-reference/account/get-account',
    inputMode: 'none',
    params: [],
  },
  {
    id: 'get_billing',
    name: 'Get Billing',
    category: 'Account',
    icon: 'WalletOutlined',
    description: 'Billing details: current plan, subscription status, token balance, billing period, and the token cost of each tool.',
    docs: 'https://developer.moltsets.com/api-reference/account/get-billing',
    inputMode: 'none',
    params: [],
  },
  {
    id: 'get_usage',
    name: 'Get Usage',
    category: 'Account',
    icon: 'BarChartOutlined',
    description: 'Day-by-day breakdown of calls, credits, successful lookups, empty results and failures for today / week / month / billing cycle.',
    docs: 'https://developer.moltsets.com/api-reference/account/get-usage',
    inputMode: 'none',
    params: [
      {
        name: 'period', label: 'Period', type: 'select',
        options: ['today', 'week', 'month', 'billing_cycle'], defaultValue: 'month',
      },
    ],
  },
];

export function getTool(id: string): MoltTool | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function toolsByCategory(): Record<string, MoltTool[]> {
  const map: Record<string, MoltTool[]> = {};
  for (const cat of CATEGORIES) map[cat] = [];
  for (const t of TOOLS) if (!map[t.category]) map[t.category] = [];
  for (const t of TOOLS) map[t.category].push(t);
  return map;
}

/** Convert a single string containing newline/comma separated values into an array */
export function splitList(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build a valid request payload from tool + raw form values */
export function buildPayload(tool: MoltTool, values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const p of tool.params) {
    const v = values[p.name];
    if (v === undefined || v === null || v === '') continue;
    if (p.type === 'textarea') {
      const list = splitList(String(v));
      if (list.length === 0) continue;
      payload[p.name] = list.length === 1 ? list[0] : list;
    } else if (p.type === 'multiselect') {
      const arr = Array.isArray(v) ? v : [v];
      if (arr.length === 0) continue;
      payload[p.name] = arr;
    } else if (p.type === 'number') {
      payload[p.name] = Number(v);
    } else if (p.type === 'switch') {
      payload[p.name] = Boolean(v);
    } else {
      payload[p.name] = v;
    }
  }
  if (tool.inputMode === 'linkedin' && tool.supportsBatch) {
    // handled by runner: singleField / batchField set by caller
  }
  return payload;
}

// Deterministic demo data engine — lets the whole dashboard be explored
// without a real API key. Clearly labelled "DEMO" in the UI.

const FIRST = ['Morgan', 'Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Ethan', 'Sophia', 'Lucas', 'Mia', 'Aiden', 'Isla', 'Carter', 'Zoe', 'Nathan', 'Ruby', 'Owen', 'Elena', 'Grant', 'Chloe', 'Priya', 'Arjun', 'Kenji', 'Yuki', 'Marco', 'Sofia', 'Dmitri', 'Anika', 'Carlos', 'Nina'];
const LAST = ['Hebb', 'Whitfield', 'Marsh', 'Delgado', 'Kowalski', 'Bennett', 'Okafor', 'Lindqvist', 'Reyes', 'Moreau', 'Tanaka', 'Silva', 'Novak', 'Ashford', 'Novak', 'Ferreira', 'Kaur', 'Blackwood', 'Vance', 'Sterling', 'Patel', 'Rossi', 'Nguyen', 'Larsen', 'Duarte'];
const TITLES = ['Account Executive', 'VP of Sales', 'Chief Marketing Officer', 'Head of Growth', 'Senior Account Manager', 'Director of Demand Generation', 'Founder & CEO', 'Head of Partnerships', 'Sales Development Manager', 'Chief Revenue Officer', 'Product Marketing Lead', 'Head of Data'];
const COMPANIES = ['Packback', 'Northwind Labs', 'BrightHollow', 'Kestrel Analytics', 'Vantage Ridge', 'Solstice Media', 'Orbit Commerce', 'Helios Health', 'Cobalt Works', 'Juniper AI', 'Meridian Retail Group', 'Fathom Robotics'];
const DOMAINS = ['packback.co', 'northwindlabs.io', 'brighthollow.com', 'kestrelanalytics.com', 'vantageridge.com', 'solsticemedia.co', 'orbitcommerce.com', 'helioshealth.io', 'cobaltworks.com', 'juniper.ai', 'meridianrg.com', 'fathomrobotics.com'];
const INDUSTRIES = ['Information Technology', 'Finance and Banking', 'Marketing & Advertising', 'Health and Pharmaceuticals', 'Professional and Business Services', 'Retail', 'Education'];
const CITIES: Array<[string, string, string]> = [
  ['Chicago', 'Illinois', 'United States'], ['Austin', 'Texas', 'United States'],
  ['San Francisco', 'California', 'United States'], ['New York', 'New York', 'United States'],
  ['Toronto', 'Ontario', 'Canada'], ['London', 'Greater London', 'United Kingdom'],
  ['Berlin', 'Berlin', 'Germany'], ['Singapore', 'Singapore', 'Singapore'],
  ['Sydney', 'New South Wales', 'Australia'], ['Mumbai', 'Maharashtra', 'India'],
  ['Sao Paulo', 'Sao Paulo', 'Brazil'], ['Amsterdam', 'North Holland', 'Netherlands'],
];
const INDUSTRY_OF: Record<string, string> = {};
COMPANIES.forEach((c, i) => { INDUSTRY_OF[c] = INDUSTRIES[i % INDUSTRIES.length]; });

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string) {
  let x = hashStr(seed) || 123456789;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}
function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function person(slugSeed: string, r: () => number) {
  const first = pick(r, FIRST);
  const last = pick(r, LAST);
  const companyIdx = Math.floor(r() * COMPANIES.length);
  const company = COMPANIES[companyIdx];
  const domain = DOMAINS[companyIdx];
  const [city, state, country] = pick(r, CITIES);
  const title = pick(r, TITLES);
  const slug = `${first}${last}`.toLowerCase();
  const risk = pick(r, ['A', 'A', 'A', 'B', 'B', 'C', 'D']);
  return {
    full_name: `${first} ${last}`,
    first_name: first,
    last_name: last,
    title,
    headline: `${INDUSTRY_OF[company]} | ${title} | Building at ${company}`,
    seniority: title.includes('Chief') || title.includes('VP') || title.includes('Head') ? pick(r, ['VP', 'C Suite', 'Head']) : pick(r, ['Senior', 'Manager', 'Director']),
    city, state, country,
    current_industry: INDUSTRY_OF[company],
    functional_area: [pick(r, ['Sales', 'Marketing', 'Information Technology', 'Operations', 'Finance'])],
    linkedin_url: `https://linkedin.com/in/${slug}`,
    business_email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    business_email_risk_score: risk,
    business_email_validated_at: '2026-09-14',
    current_role_start_date: `202${Math.floor(r() * 5)}-0${1 + Math.floor(r() * 9)}-01`,
    last_updated_at: '2026-09-01',
    company: {
      name: company,
      size: pick(r, ['51', '120', '340', '780', '2100']),
      industry: INDUSTRY_OF[company],
      website_url: `https://www.${domain}/`,
      domain,
      linkedin_url: `linkedin.com/company/${company.toLowerCase().replace(/[^a-z]/g, '')}`,
      naics_codes: ['5112', '51121', '511210'],
      naics_titles: ['Software Publishers'],
      linkedin_industry: [pick(r, ['Software Development', 'IT Services and IT Consulting', 'Financial Services'])],
      logo_url: '',
    },
    _id: slug,
    _score: Math.round((6 + r() * 5) * 1000) / 1000,
  };
}

function company(seed: string, r: () => number) {
  const idx = Math.floor(r() * COMPANIES.length);
  const name = COMPANIES[idx];
  const domain = DOMAINS[idx];
  const [city, state, country] = pick(r, CITIES);
  const emp = pick(r, ['21-50', '51-200', '201-500', '501-1000']);
  return {
    name,
    domain,
    industry: INDUSTRY_OF[name],
    linkedin_url: `linkedin.com/company/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
    revenue_range: pick(r, ['$5M - $10M', '$10M - $20M', '$20M - $50M', 'Above $50M']),
    employee_count: emp.split('-')[1] || '5000',
    employee_range: emp,
    city, state, country,
    naics_codes: ['511210'],
    naics_titles: ['Software Publishers'],
    linkedin_industry: [pick(r, ['Software Development', 'IT Services and IT Consulting'])],
    logo_url: '',
    _id: domain,
    _score: Math.round((6 + r() * 5) * 1000) / 1000,
  };
}

function usageDays(period: string, r: () => number) {
  const n = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const calls = Math.floor(120 + r() * 900);
    const withData = Math.floor(calls * (0.45 + r() * 0.15));
    const failed = Math.floor(calls * (0.005 + r() * 0.01));
    days.push({
      date: d.toISOString().slice(0, 10),
      calls,
      tokens: Math.floor(calls * 0.55),
      with_data: withData,
      without_data: Math.max(0, calls - withData - failed),
      failed,
    });
  }
  return days;
}

function emailResult(seed: string, r: () => number) {
  const first = pick(r, FIRST).toLowerCase();
  const last = pick(r, LAST).toLowerCase();
  const idx = Math.floor(r() * DOMAINS.length);
  const domain = DOMAINS[idx];
  const found = r() > 0.18;
  if (!found) return null;
  const type = r() > 0.75 ? 'personal' : 'business';
  return {
    email: type === 'business' ? `${first}.${last}@${domain}` : `${first}.${last}@gmail.com`,
    risk_score: pick(r, ['A', 'A', 'B', 'B', 'C', 'D', 'F']),
    type,
    last_validated_at: new Date(Date.now() - Math.floor(r() * 30) * 86400000).toISOString(),
  };
}

function phoneResult(r: () => number) {
  if (r() > 0.82) return null;
  return {
    phone_number: `+1${Math.floor(2000000000 + r() * 7999999999)}`,
    carrier: pick(r, ['Verizon Wireless', 'T-Mobile USA', 'AT&T Mobility', 'Boost Mobile']),
    line_type: 'mobile',
    verified: true,
  };
}

function reverseEmailResult(r: () => number) {
  const first = pick(r, FIRST);
  const last = pick(r, LAST);
  const idx = Math.floor(r() * COMPANIES.length);
  const company = COMPANIES[idx];
  const domain = DOMAINS[idx];
  return {
    first_name: first,
    last_name: last,
    title: pick(r, TITLES),
    seniority: pick(r, ['Senior', 'Manager', 'Director', 'VP', 'C Suite']),
    functional_area: pick(r, ['Sales', 'Marketing', 'Information Technology']),
    linkedinurl: `https://linkedin.com/in/${first.toLowerCase()}${last.toLowerCase()}`,
    current_company: company,
    current_company_url: `https://www.${domain}`,
    current_company_linkedinurl: `linkedin.com/company/${company.toLowerCase()}`,
    country: pick(r, ['United States', 'United Kingdom', 'Canada', 'Germany']),
    company_employee_count: pick(r, ['85', '210', '640', '1800']),
    company_employee_range: pick(r, ['51-200', '201-500', '501-1000']),
    company_revenue: pick(r, ['$12M', '$28M', '$64M']),
    company_revenue_range: pick(r, ['$10M - $20M', '$20M - $50M', 'Above $50M']),
    work_email_confirmed: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    work_email_confirmed_status: 'verified',
    work_email_confirmed_risk_score: pick(r, ['A', 'A', 'B']),
    personal_emails: r() > 0.5 ? [`${first.toLowerCase()}${last.toLowerCase()}@gmail.com`] : [],
    personal_emails_status: [null],
    personal_emails_risk_score: [pick(r, ['B', 'C'])],
  };
}

function maidResult(r: () => number) {
  const out = [];
  const n = Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    out.push({
      device_id: r() > 0.5
        ? Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
        : Array.from({ length: 36 }, (_, i) => (i === 8 || i === 13 || i === 18 || i === 23) ? '-' : '0123456789abcdef'[Math.floor(r() * 16)]).join(''),
      device_type: r() > 0.5 ? 'AAID' : 'IDFA',
    });
  }
  return out;
}

export function demoResponse(tool: string, payload: Record<string, unknown>): Record<string, unknown> {
  const r = rng(tool + JSON.stringify(payload));
  const fairUse = {
    records_remaining_5h: 89000 + Math.floor(r() * 2000),
    records_reset_5h: new Date(Date.now() + 3 * 3600000).toISOString(),
    records_remaining_1w: 300000 + Math.floor(r() * 20000),
    records_reset_1w: new Date(Date.now() + 5 * 86400000).toISOString(),
  };
  const notFoundEnvelope = { results: null, status: 'not_found', metadata: { fair_use: fairUse } };

  switch (tool) {
    case 'search_people': {
      const limit = Math.min(Number(payload.limit) || 10, 25);
      const offset = Number(payload.offset) || 0;
      const results = Array.from({ length: limit }, (_, i) => person(`${offset + i}`, rng(`p${offset + i}` + String(payload.query || payload.title || ''))));
      return { results: { results, total: 278 + Math.floor(r() * 4000) }, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'search_companies': {
      const limit = Math.min(Number(payload.limit) || 10, 25);
      const offset = Number(payload.offset) || 0;
      const results = Array.from({ length: limit }, (_, i) => {
        const base = hashStr(String(payload.query || payload.domain || payload.industry || 'co')) % COMPANIES.length;
        const idx = (base + offset + i) % COMPANIES.length;
        const c = company(`c${idx}-${offset}-${i}`, rng(`c${idx}-${offset}-${i}`));
        c.name = COMPANIES[idx];
        c.domain = DOMAINS[idx];
        c.industry = INDUSTRY_OF[COMPANIES[idx]];
        return c;
      });
      return { results: { results, total: 143 + Math.floor(r() * 900) }, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'search_linkedin_profile': {
      if (payload.count_only) {
        return { results: { count: Math.floor(r() * 6) }, status: 'ok', metadata: { fair_use: fairUse } };
      }
      const results = Array.from({ length: 1 + Math.floor(r() * 3) }, () => {
        const p = person(`lp${r()}`, r);
        return { full_name: p.full_name, first_name: p.first_name, last_name: p.last_name, linkedin_slug: p._id, linkedin_url: p.linkedin_url, company: p.company.name };
      });
      return { results, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'search_business_email_by_name': {
      const e = emailResult('sben', r);
      if (!e) return notFoundEnvelope;
      const p = person('sben', r);
      return {
        results: { email: e.email, risk_score: e.risk_score, linkedin_url: p.linkedin_url },
        status: 'ok', metadata: { fair_use: fairUse },
      };
    }
    case 'search_business_profile_by_name': {
      return { results: person('sbp', r), status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'linkedin_to_best_email':
    case 'linkedin_to_business_email':
    case 'linkedin_to_personal_email_usa':
    case 'linkedin_to_best_personal_email_usa': {
      const urls = (payload.linkedin_urls as string[]) || (payload.linkedin_url ? [payload.linkedin_url as string] : []);
      const per = urls.map((u) => ({ input: u, result: emailResult(u, r) }));
      return { results: per, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'linkedin_to_mobile_phone': {
      const urls = (payload.linkedin_urls as string[]) || (payload.linkedin_url ? [payload.linkedin_url as string] : []);
      const per = urls.map((u) => ({ input: u, result: phoneResult(r) }));
      return { results: per, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'reverse_email_lookup': {
      const emails = (payload.emails as string[]) || (payload.email ? [payload.email as string] : []);
      const per = emails.map((e) => ({ input: e, result: reverseEmailResult(r) }));
      return { results: per, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'reverse_linkedin_lookup': {
      const urls = (payload.linkedin_urls as string[]) || (payload.linkedin_url ? [payload.linkedin_url as string] : []);
      const per = urls.map((u) => ({ input: u, result: reverseEmailResult(r) }));
      return { results: per, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'email_to_maid': {
      const out = maidResult(r);
      if (!out.length) return notFoundEnvelope;
      return { results: out, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'business_email_to_sha256':
    case 'linkedin_to_sha256': {
      const hash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');
      return {
        results: tool === 'business_email_to_sha256' ? { personal_email_SHA256: hash } : { linkedin_SHA256: hash },
        status: 'ok', metadata: { fair_use: fairUse },
      };
    }
    case 'email_to_linkedin': {
      return { results: { linkedin_url: `https://linkedin.com/in/${pick(r, FIRST).toLowerCase()}${pick(r, LAST).toLowerCase()}` }, status: 'ok', metadata: { fair_use: fairUse } };
    }
    case 'ip_to_company': {
      const c = company('ip', r);
      return {
        results: { company_name: c.name, domain: c.domain, industry: c.industry, country: c.country, employee_range: c.employee_range, linkedin_url: c.linkedin_url },
        status: 'ok', metadata: { fair_use: fairUse },
      };
    }
    case 'get_account': {
      return {
        results: {
          id: 'demoAcc01', name: 'Demo Workspace', status: 'active', plan: 'subscription_97',
          token_balance: -1, unlimited: true,
          fair_use: {
            enrich: {
              records: {
                '5h': { limit: 15000, used: 1420, remaining: 13580, resets_at: new Date(Date.now() + 2 * 3600000).toISOString() },
                '1w': { limit: 75000, used: 9820, remaining: 65180, resets_at: new Date(Date.now() + 4 * 86400000).toISOString() },
              },
              requests: { '5h': { limit: 75000, used: 1461, remaining: 73539, resets_at: new Date(Date.now() + 2 * 3600000).toISOString() } },
            },
            search: {
              records: {
                '5h': { limit: 7500, used: 1180, remaining: 6320, resets_at: new Date(Date.now() + 2 * 3600000).toISOString() },
                '1w': { limit: 37500, used: 12480, remaining: 25020, resets_at: new Date(Date.now() + 4 * 86400000).toISOString() },
              },
              requests: { '5h': { limit: 37500, used: 1180, remaining: 36320, resets_at: new Date(Date.now() + 2 * 3600000).toISOString() } },
            },
          },
          search_trial: null,
          phone_token_balance: 132,
          phone_token_allowance: 180,
          phone_tokens_purchased: 10,
          phone_tokens_plan: 122,
          phone_plan: 'phone_plan_27',
          phone_plan_ends_at: null,
          personal_email_available: true,
          api_key_count: 1,
          user_count: 2,
          created_at: '2026-05-13T18:36:29Z',
        },
        status: 'ok', metadata: {},
      };
    }
    case 'get_billing': {
      return {
        results: {
          plan: 'subscription_97', subscription_status: 'active', token_balance: -1, unlimited: true,
          current_period_start: new Date(Date.now() - 12 * 86400000).toISOString(),
          current_period_end: new Date(Date.now() + 18 * 86400000).toISOString(),
          token_costs: {
            get_account: 0, get_billing: 0, get_usage: 0,
            search_people: 0, search_companies: 0, search_linkedin_profile: 1,
            search_business_email_by_name: 1, search_business_profile_by_name: 1,
            linkedin_to_best_email: 1, linkedin_to_business_email: 1,
            linkedin_to_personal_email_usa: 1, linkedin_to_best_personal_email_usa: 1,
            linkedin_to_mobile_phone: 0, reverse_email_lookup: 1, reverse_linkedin_lookup: 1,
            email_to_maid: 1, business_email_to_sha256: 1, linkedin_to_sha256: 1,
            email_to_linkedin: 1, ip_to_company: 1,
          },
        },
        status: 'ok', metadata: { fair_use: fairUse },
      };
    }
    case 'get_usage': {
      const period = String(payload.period || 'today');
      const days = usageDays(period, r);
      const totals = days.reduce(
        (acc, d) => ({
          calls: acc.calls + d.calls, tokens: acc.tokens + d.tokens,
          with_data: acc.with_data + d.with_data, without_data: acc.without_data + d.without_data,
          failed: acc.failed + d.failed,
        }),
        { calls: 0, tokens: 0, with_data: 0, without_data: 0, failed: 0 },
      );
      return {
        results: {
          period, start_date: days[0]?.date, end_date: days[days.length - 1]?.date,
          token_balance: -1, days, totals,
        },
        status: 'ok', metadata: { fair_use: fairUse },
      };
    }
    default:
      return notFoundEnvelope;
  }
}

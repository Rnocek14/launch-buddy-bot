// Sample demo data for the live demo mode
// This provides realistic-looking data without any fake stats or testimonials

export interface DemoService {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status: 'verified' | 'ai_discovered' | 'needs_discovery';
  domain: string;
  deletion_requested_at?: string | null;
  deletion_status?: string | null;
}

export const demoServices: DemoService[] = [
  {
    id: "demo-1",
    name: "Spotify",
    logo_url: "https://logo.clearbit.com/spotify.com",
    homepage_url: "https://spotify.com",
    category: "Entertainment",
    discovered_at: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString(), // 5 years ago
    contact_status: "verified",
    domain: "spotify.com",
  },
  {
    id: "demo-2",
    name: "LinkedIn",
    logo_url: "https://logo.clearbit.com/linkedin.com",
    homepage_url: "https://linkedin.com",
    category: "Professional",
    discovered_at: new Date(Date.now() - 2190 * 24 * 60 * 60 * 1000).toISOString(), // 6 years ago
    contact_status: "verified",
    domain: "linkedin.com",
  },
  {
    id: "demo-3",
    name: "Dropbox",
    logo_url: "https://logo.clearbit.com/dropbox.com",
    homepage_url: "https://dropbox.com",
    category: "Cloud Storage",
    discovered_at: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString(), // 4 years ago
    contact_status: "verified",
    domain: "dropbox.com",
    deletion_requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deletion_status: "pending",
  },
  {
    id: "demo-4",
    name: "Canva",
    logo_url: "https://logo.clearbit.com/canva.com",
    homepage_url: "https://canva.com",
    category: "Design",
    discovered_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
    contact_status: "ai_discovered",
    domain: "canva.com",
  },
  {
    id: "demo-5",
    name: "Notion",
    logo_url: "https://logo.clearbit.com/notion.so",
    homepage_url: "https://notion.so",
    category: "Productivity",
    discovered_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
    contact_status: "verified",
    domain: "notion.so",
  },
  {
    id: "demo-6",
    name: "Figma",
    logo_url: "https://logo.clearbit.com/figma.com",
    homepage_url: "https://figma.com",
    category: "Design",
    discovered_at: new Date(Date.now() - 540 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 years ago
    contact_status: "verified",
    domain: "figma.com",
  },
  {
    id: "demo-7",
    name: "Slack",
    logo_url: "https://logo.clearbit.com/slack.com",
    homepage_url: "https://slack.com",
    category: "Communication",
    discovered_at: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(), // 3 years ago
    contact_status: "verified",
    domain: "slack.com",
  },
  {
    id: "demo-8",
    name: "Mailchimp",
    logo_url: "https://logo.clearbit.com/mailchimp.com",
    homepage_url: "https://mailchimp.com",
    category: "Marketing",
    discovered_at: new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000).toISOString(), // 7 years ago
    contact_status: "needs_discovery",
    domain: "mailchimp.com",
  },
  {
    id: "demo-9",
    name: "Trello",
    logo_url: "https://logo.clearbit.com/trello.com",
    homepage_url: "https://trello.com",
    category: "Productivity",
    discovered_at: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString(), // 4 years ago
    contact_status: "ai_discovered",
    domain: "trello.com",
    deletion_requested_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    deletion_status: "completed",
  },
  {
    id: "demo-10",
    name: "Zoom",
    logo_url: "https://logo.clearbit.com/zoom.us",
    homepage_url: "https://zoom.us",
    category: "Communication",
    discovered_at: new Date(Date.now() - 912 * 24 * 60 * 60 * 1000).toISOString(), // 2.5 years ago
    contact_status: "verified",
    domain: "zoom.us",
  },
  {
    id: "demo-11",
    name: "Adobe Creative Cloud",
    logo_url: "https://logo.clearbit.com/adobe.com",
    homepage_url: "https://adobe.com",
    category: "Design",
    discovered_at: new Date(Date.now() - 2920 * 24 * 60 * 60 * 1000).toISOString(), // 8 years ago
    contact_status: "verified",
    domain: "adobe.com",
  },
  {
    id: "demo-12",
    name: "Shopify",
    logo_url: "https://logo.clearbit.com/shopify.com",
    homepage_url: "https://shopify.com",
    category: "E-commerce",
    discovered_at: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(), // 3 years ago
    contact_status: "needs_discovery",
    domain: "shopify.com",
  },
  {
    id: "demo-13",
    name: "Stripe",
    logo_url: "https://logo.clearbit.com/stripe.com",
    homepage_url: "https://stripe.com",
    category: "Financial",
    discovered_at: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString(), // 5 years ago
    contact_status: "verified",
    domain: "stripe.com",
  },
  {
    id: "demo-14",
    name: "GitHub",
    logo_url: "https://logo.clearbit.com/github.com",
    homepage_url: "https://github.com",
    category: "Developer Tools",
    discovered_at: new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000).toISOString(), // 7 years ago
    contact_status: "verified",
    domain: "github.com",
  },
  {
    id: "demo-15",
    name: "Airbnb",
    logo_url: "https://logo.clearbit.com/airbnb.com",
    homepage_url: "https://airbnb.com",
    category: "Travel",
    discovered_at: new Date(Date.now() - 2190 * 24 * 60 * 60 * 1000).toISOString(), // 6 years ago
    contact_status: "ai_discovered",
    domain: "airbnb.com",
    deletion_requested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deletion_status: "pending",
  },
  {
    id: "demo-16",
    name: "Uber",
    logo_url: "https://logo.clearbit.com/uber.com",
    homepage_url: "https://uber.com",
    category: "Transportation",
    discovered_at: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString(), // 4 years ago
    contact_status: "verified",
    domain: "uber.com",
  },
  {
    id: "demo-17",
    name: "Netflix",
    logo_url: "https://logo.clearbit.com/netflix.com",
    homepage_url: "https://netflix.com",
    category: "Entertainment",
    discovered_at: new Date(Date.now() - 2920 * 24 * 60 * 60 * 1000).toISOString(), // 8 years ago
    contact_status: "verified",
    domain: "netflix.com",
  },
  {
    id: "demo-18",
    name: "Medium",
    logo_url: "https://logo.clearbit.com/medium.com",
    homepage_url: "https://medium.com",
    category: "Publishing",
    discovered_at: new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000).toISOString(), // 5 years ago
    contact_status: "needs_discovery",
    domain: "medium.com",
  },
  {
    id: "demo-19",
    name: "Twitch",
    logo_url: "https://logo.clearbit.com/twitch.tv",
    homepage_url: "https://twitch.tv",
    category: "Entertainment",
    discovered_at: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(), // 3 years ago
    contact_status: "ai_discovered",
    domain: "twitch.tv",
  },
  {
    id: "demo-20",
    name: "Grammarly",
    logo_url: "https://logo.clearbit.com/grammarly.com",
    homepage_url: "https://grammarly.com",
    category: "Productivity",
    discovered_at: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(), // 2 years ago
    contact_status: "verified",
    domain: "grammarly.com",
  },
  {
    id: "demo-21",
    name: "Etsy",
    logo_url: "https://logo.clearbit.com/etsy.com",
    homepage_url: "https://etsy.com",
    category: "E-commerce",
    discovered_at: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString(), // 4 years ago
    contact_status: "verified",
    domain: "etsy.com",
    deletion_requested_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    deletion_status: "completed",
  },
  {
    id: "demo-22",
    name: "Pinterest",
    logo_url: "https://logo.clearbit.com/pinterest.com",
    homepage_url: "https://pinterest.com",
    category: "Social",
    discovered_at: new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000).toISOString(), // 7 years ago
    contact_status: "verified",
    domain: "pinterest.com",
  },
  {
    id: "demo-23",
    name: "Discord",
    logo_url: "https://logo.clearbit.com/discord.com",
    homepage_url: "https://discord.com",
    category: "Communication",
    discovered_at: new Date(Date.now() - 912 * 24 * 60 * 60 * 1000).toISOString(), // 2.5 years ago
    contact_status: "verified",
    domain: "discord.com",
  },
  {
    id: "demo-24",
    name: "Paypal",
    logo_url: "https://logo.clearbit.com/paypal.com",
    homepage_url: "https://paypal.com",
    category: "Financial",
    discovered_at: new Date(Date.now() - 3285 * 24 * 60 * 60 * 1000).toISOString(), // 9 years ago
    contact_status: "verified",
    domain: "paypal.com",
  },
];

export const demoRiskData = {
  riskScore: 67,
  riskLevel: "medium" as const,
  factors: {
    totalAccounts: demoServices.length,
    oldAccountsCount: demoServices.filter(s => {
      const age = (Date.now() - new Date(s.discovered_at).getTime()) / (365 * 24 * 60 * 60 * 1000);
      return age > 3;
    }).length,
    sensitiveAccountsCount: demoServices.filter(s => 
      ['Financial', 'Social', 'E-commerce'].includes(s.category)
    ).length,
    unmatchedDomainsCount: 8,
    avgAccountAge: 4.2,
  },
  insights: "Your digital footprint shows moderate exposure. Consider reviewing older accounts and those in sensitive categories like Financial and Social.",
  percentile: 45,
  exposureFactors: [
    {
      factor: "Old Accounts",
      count: 14,
      contribution: 35,
      description: "Accounts older than 3 years that may have outdated security settings",
    },
    {
      factor: "Financial Services",
      count: 3,
      contribution: 25,
      description: "Accounts with access to payment or financial information",
    },
    {
      factor: "Social Platforms",
      count: 2,
      contribution: 20,
      description: "Accounts with personal data and social connections",
    },
    {
      factor: "E-commerce",
      count: 3,
      contribution: 20,
      description: "Accounts storing payment and address information",
    },
  ],
  topCategories: [
    { category: "Entertainment", count: 4 },
    { category: "Productivity", count: 4 },
    { category: "Design", count: 3 },
    { category: "Communication", count: 3 },
    { category: "Financial", count: 2 },
  ],
};

export const demoMonthlyStats = {
  newServicesCount: 2,
  reappearedCount: 0,
  totalDeletions: 4,
  lastScanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const demoUnmatchedDomains = [
  { domain: "newsletter.somesite.com", email_from: "noreply@newsletter.somesite.com", occurrence_count: 12 },
  { domain: "promo.retailer.com", email_from: "deals@promo.retailer.com", occurrence_count: 8 },
  { domain: "updates.oldservice.io", email_from: "team@updates.oldservice.io", occurrence_count: 5 },
];

export const demoUser = {
  id: "demo-user",
  email: "demo@example.com",
  user_metadata: {
    full_name: "Demo User",
    avatar_url: null,
  },
};

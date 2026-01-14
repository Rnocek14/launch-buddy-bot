// Web search engine patterns for exposure detection
export interface SearchEnginePattern {
  engine: string;
  name: string;
  searchUrlTemplate: string;
  resultSelectors: {
    resultContainer: string;
    resultLink: string;
    resultTitle: string;
    resultSnippet: string;
  };
  rateLimit: number; // requests per minute
}

export const searchEnginePatterns: SearchEnginePattern[] = [
  {
    engine: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrlTemplate: 'https://html.duckduckgo.com/html/?q={query}',
    resultSelectors: {
      resultContainer: '.result',
      resultLink: '.result__a',
      resultTitle: '.result__a',
      resultSnippet: '.result__snippet',
    },
    rateLimit: 10,
  },
  {
    engine: 'bing',
    name: 'Bing',
    searchUrlTemplate: 'https://www.bing.com/search?q={query}',
    resultSelectors: {
      resultContainer: '.b_algo',
      resultLink: 'h2 a',
      resultTitle: 'h2 a',
      resultSnippet: '.b_caption p',
    },
    rateLimit: 15,
  },
];

// Query templates for different types of exposure searches
export interface ExposureQueryTemplate {
  type: string;
  name: string;
  description: string;
  queryTemplate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const exposureQueryTemplates: ExposureQueryTemplate[] = [
  {
    type: 'full_name_location',
    name: 'Name + Location Search',
    description: 'Search for name with city/state',
    queryTemplate: '"{firstName} {lastName}" {city} {state}',
    severity: 'medium',
  },
  {
    type: 'email_direct',
    name: 'Email Address Search',
    description: 'Direct email address search',
    queryTemplate: '"{email}"',
    severity: 'high',
  },
  {
    type: 'phone_search',
    name: 'Phone Number Search',
    description: 'Search for phone number',
    queryTemplate: '"{phone}"',
    severity: 'high',
  },
  {
    type: 'social_profiles',
    name: 'Social Media Profiles',
    description: 'Find social media profiles',
    queryTemplate: '"{firstName} {lastName}" site:linkedin.com OR site:facebook.com OR site:twitter.com',
    severity: 'medium',
  },
  {
    type: 'people_search_sites',
    name: 'People Search Sites',
    description: 'Check people search aggregators',
    queryTemplate: '"{firstName} {lastName}" site:spokeo.com OR site:whitepages.com OR site:truepeoplesearch.com',
    severity: 'critical',
  },
];

// Known data broker and people search domains
export const knownBrokerDomains = [
  'spokeo.com',
  'whitepages.com',
  'truepeoplesearch.com',
  'fastpeoplesearch.com',
  'beenverified.com',
  'intelius.com',
  'radaris.com',
  'peoplefinder.com',
  'usphonebook.com',
  'anywho.com',
  'zabasearch.com',
  'pipl.com',
  'instantcheckmate.com',
  'ussearch.com',
  'peekyou.com',
  'thatsthem.com',
  'nuwber.com',
  'publicrecordsnow.com',
  'peoplesearchnow.com',
  'addresses.com',
  'mylife.com',
  'familytreenow.com',
  'clustrmaps.com',
  'cyberbackgroundchecks.com',
  'checkpeople.com',
];

// Social media domains to track
export const socialMediaDomains = [
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'reddit.com',
  'pinterest.com',
  'youtube.com',
  'github.com',
  'medium.com',
];

// Severity classification based on data type exposure
export const severityByDataType: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  email: 'medium',
  phone: 'high',
  address: 'high',
  ssn: 'critical',
  financial: 'critical',
  medical: 'critical',
  password: 'critical',
  photo: 'medium',
  username: 'low',
  social_profile: 'low',
  employment: 'medium',
  education: 'low',
  relatives: 'high',
  criminal_record: 'critical',
};

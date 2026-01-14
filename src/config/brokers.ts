// Broker detection patterns for automated scanning
export interface BrokerDetectionPattern {
  slug: string;
  name: string;
  searchUrlTemplate: string;
  resultSelectors: {
    noResults: string[];
    hasResults: string[];
    profileLink?: string;
  };
  searchFields: {
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
  };
}

export const brokerPatterns: BrokerDetectionPattern[] = [
  {
    slug: 'beenverified',
    name: 'BeenVerified',
    searchUrlTemplate: 'https://www.beenverified.com/f/optout/search',
    resultSelectors: {
      noResults: ['.no-results', 'No records found'],
      hasResults: ['.person-card', '.result-item', 'We found'],
      profileLink: '.person-card a',
    },
    searchFields: {
      firstName: 'input[name="firstName"]',
      lastName: 'input[name="lastName"]',
      city: 'input[name="city"]',
      state: 'select[name="state"]',
    },
  },
  {
    slug: 'spokeo',
    name: 'Spokeo',
    searchUrlTemplate: 'https://www.spokeo.com/search?q={firstName}+{lastName}+{city}+{state}',
    resultSelectors: {
      noResults: ['.no-results-message', 'No results found'],
      hasResults: ['.result-card', '.search-result', 'results for'],
      profileLink: '.result-card a',
    },
    searchFields: {},
  },
  {
    slug: 'whitepages',
    name: 'Whitepages',
    searchUrlTemplate: 'https://www.whitepages.com/name/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results', '.empty-state'],
      hasResults: ['.serp-card', '.person-primary-info'],
      profileLink: '.serp-card a',
    },
    searchFields: {},
  },
  {
    slug: 'truepeoplesearch',
    name: 'TruePeopleSearch',
    searchUrlTemplate: 'https://www.truepeoplesearch.com/results?name={firstName}%20{lastName}&citystatezip={city}%20{state}',
    resultSelectors: {
      noResults: ['no results', '.no-results'],
      hasResults: ['.card-summary', '.people-list'],
      profileLink: '.card-summary a',
    },
    searchFields: {},
  },
  {
    slug: 'fastpeoplesearch',
    name: 'FastPeopleSearch',
    searchUrlTemplate: 'https://www.fastpeoplesearch.com/name/{firstName}-{lastName}_{city}-{state}',
    resultSelectors: {
      noResults: ['No results found', '.no-results'],
      hasResults: ['.card', '.result-list'],
      profileLink: '.card a',
    },
    searchFields: {},
  },
  {
    slug: 'thatsthem',
    name: "That'sThem",
    searchUrlTemplate: 'https://thatsthem.com/name/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['no matches', 'no results'],
      hasResults: ['.ThatsThem-record', '.result-record'],
      profileLink: '.ThatsThem-record a',
    },
    searchFields: {},
  },
  {
    slug: 'nuwber',
    name: 'Nuwber',
    searchUrlTemplate: 'https://nuwber.com/search?name={firstName}%20{lastName}&city={city}&state={state}',
    resultSelectors: {
      noResults: ['No results', '.empty-results'],
      hasResults: ['.person-card', '.search-result-item'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  // Additional brokers
  {
    slug: 'radaris',
    name: 'Radaris',
    searchUrlTemplate: 'https://radaris.com/p/{firstName}/{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['no records found', '.no-results'],
      hasResults: ['.person-card', '.result-item'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'intelius',
    name: 'Intelius',
    searchUrlTemplate: 'https://www.intelius.com/people-search/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results', '.empty-state'],
      hasResults: ['.person-card', '.search-results'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'peoplefinder',
    name: 'PeopleFinder',
    searchUrlTemplate: 'https://www.peoplefinder.com/name/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results found'],
      hasResults: ['.person-card', '.search-result'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'usphonebook',
    name: 'US Phone Book',
    searchUrlTemplate: 'https://www.usphonebook.com/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results'],
      hasResults: ['.result-card', '.person-info'],
      profileLink: '.result-card a',
    },
    searchFields: {},
  },
  {
    slug: 'anywho',
    name: 'AnyWho',
    searchUrlTemplate: 'https://www.anywho.com/people/{firstName}+{lastName}/{city}+{state}',
    resultSelectors: {
      noResults: ['No results found'],
      hasResults: ['.result-card', '.person-card'],
      profileLink: '.result-card a',
    },
    searchFields: {},
  },
  {
    slug: 'zabasearch',
    name: 'ZabaSearch',
    searchUrlTemplate: 'https://www.zabasearch.com/people/{firstName}+{lastName}/{city}+{state}',
    resultSelectors: {
      noResults: ['No matches', 'no results'],
      hasResults: ['.result-item', '.person-listing'],
      profileLink: '.result-item a',
    },
    searchFields: {},
  },
  {
    slug: 'instantcheckmate',
    name: 'Instant Checkmate',
    searchUrlTemplate: 'https://www.instantcheckmate.com/people/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results', '.empty-state'],
      hasResults: ['.person-card', '.result-container'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'ussearch',
    name: 'US Search',
    searchUrlTemplate: 'https://www.ussearch.com/search/results/person/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results found'],
      hasResults: ['.person-card', '.search-result'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'peekyou',
    name: 'PeekYou',
    searchUrlTemplate: 'https://www.peekyou.com/{firstName}_{lastName}/{city}_{state}',
    resultSelectors: {
      noResults: ['no results', 'No matches'],
      hasResults: ['.result-card', '.person-info'],
      profileLink: '.result-card a',
    },
    searchFields: {},
  },
  {
    slug: 'publicrecordsnow',
    name: 'PublicRecordsNow',
    searchUrlTemplate: 'https://www.publicrecordsnow.com/name/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No records found'],
      hasResults: ['.result-item', '.person-result'],
      profileLink: '.result-item a',
    },
    searchFields: {},
  },
  {
    slug: 'peoplesearchnow',
    name: 'PeopleSearchNow',
    searchUrlTemplate: 'https://www.peoplesearchnow.com/person/{firstName}-{lastName}_{city}-{state}',
    resultSelectors: {
      noResults: ['No results'],
      hasResults: ['.person-card', '.result-list'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'addresses',
    name: 'Addresses.com',
    searchUrlTemplate: 'https://www.addresses.com/people/{firstName}+{lastName}/{city}+{state}',
    resultSelectors: {
      noResults: ['No results found'],
      hasResults: ['.result-card', '.person-info'],
      profileLink: '.result-card a',
    },
    searchFields: {},
  },
  {
    slug: 'mylife',
    name: 'MyLife',
    searchUrlTemplate: 'https://www.mylife.com/pub/search?firstName={firstName}&lastName={lastName}&city={city}&state={state}',
    resultSelectors: {
      noResults: ['No results', '.empty-state'],
      hasResults: ['.person-card', '.search-result'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'familytreenow',
    name: 'FamilyTreeNow',
    searchUrlTemplate: 'https://www.familytreenow.com/search/genealogy/results?first={firstName}&last={lastName}&city={city}&state={state}',
    resultSelectors: {
      noResults: ['No results', 'no matches'],
      hasResults: ['.result-item', '.person-card'],
      profileLink: '.result-item a',
    },
    searchFields: {},
  },
  {
    slug: 'clustrmaps',
    name: 'ClustrMaps',
    searchUrlTemplate: 'https://clustrmaps.com/person/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No results found'],
      hasResults: ['.person-info', '.result-card'],
      profileLink: '.person-info a',
    },
    searchFields: {},
  },
  {
    slug: 'cyberbackgroundchecks',
    name: 'CyberBackgroundChecks',
    searchUrlTemplate: 'https://www.cyberbackgroundchecks.com/people/{firstName}-{lastName}/{city}-{state}',
    resultSelectors: {
      noResults: ['No records found'],
      hasResults: ['.person-card', '.result-item'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
  {
    slug: 'checkpeople',
    name: 'CheckPeople',
    searchUrlTemplate: 'https://checkpeople.com/search?first={firstName}&last={lastName}&city={city}&state={state}',
    resultSelectors: {
      noResults: ['No results'],
      hasResults: ['.person-card', '.search-result'],
      profileLink: '.person-card a',
    },
    searchFields: {},
  },
];

// Status badge colors
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  scanning: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  found: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  clean: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
  error: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  opted_out: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30' },
};

// Difficulty badge colors
export const difficultyColors: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-green-500/10', text: 'text-green-600' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-600' },
};

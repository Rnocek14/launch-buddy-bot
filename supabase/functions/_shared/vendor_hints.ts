export type VendorHint = {
  platform: 'onetrust'|'securiti'|'trustarc'|'cookiebot'|'transcend'|'ketch'|'osano'|'cookieyes'|'didomi'|'termly'|'unknown';
  prefill_supported: boolean;
  // CSS selectors and common field names to try (order = priority)
  selectors: {
    email?: string[];
    full_name?: string[];
    country?: string[];
    request_type?: string[];
    submit?: string[];
  };
  request_types?: Array<{label:string,value:string}>;
};

export const VENDOR_HINTS: Record<string, VendorHint> = {
  onetrust: {
    platform: 'onetrust', prefill_supported: false,
    selectors: {
      email:      ['input#email', 'input[name="email"]', 'input[type="email"]'],
      full_name:  ['input#name','input[name="name"]','input[name="fullName"]'],
      country:    ['select#country','select[name="country"]'],
      request_type:['select#requestType','select[name*="request"]'],
      submit:     ['button[type="submit"]','button.otdsr-submit','input[type="submit"]']
    },
    request_types: [{label:'Access',value:'access'},{label:'Deletion',value:'deletion'}]
  },
  securiti: {
    platform: 'securiti', prefill_supported: true,
    selectors: {
      email:['input[type="email"]','input[name="email"]'],
      full_name:['input[name="name"]','input[name="full_name"]'],
      country:['select[name="country"]'],
      request_type:['select[name="request_type"]'],
      submit:['button[type="submit"]','button.sc-dsr-submit']
    },
    request_types: [{label:'Access',value:'access'},{label:'Deletion',value:'deletion'}]
  },
  trustarc: {
    platform: 'trustarc', prefill_supported: false,
    selectors: {
      email:['input[type="email"]','input[name="Email"]'],
      full_name:['input[name="FullName"]','input[name="Name"]'],
      country:['select[name="Country"]'],
      request_type:['select[name="Request"]'],
      submit:['button[type="submit"]','input[type="submit"]']
    },
    request_types: [{label:'Access',value:'access'},{label:'Deletion',value:'deletion'}]
  },
  cookiebot: {
    platform: 'cookiebot', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      full_name:['input[name="name"]'],
      submit:['button[type="submit"]']
    }
  },
  transcend: {
    platform: 'transcend', prefill_supported: true,
    selectors: {
      email:['input[type="email"]','input[name="email"]'],
      full_name:['input[name="name"]'],
      submit:['button[type="submit"]']
    }
  },
  ketch: {
    platform: 'ketch', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      submit:['button[type="submit"]']
    }
  },
  osano: {
    platform: 'osano', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      submit:['button[type="submit"]']
    }
  },
  cookieyes: {
    platform: 'cookieyes', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      submit:['button[type="submit"]']
    }
  },
  didomi: {
    platform: 'didomi', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      submit:['button[type="submit"]']
    }
  },
  termly: {
    platform: 'termly', prefill_supported: false,
    selectors: {
      email:['input[type="email"]'],
      submit:['button[type="submit"]']
    }
  },
  unknown: { platform:'unknown', prefill_supported:false, selectors:{} }
};

// Domain-specific hints for known problematic domains
export const DOMAIN_HINTS: Record<string, {
  privacy_url_pattern?: string;
  requires_js: boolean;
  exclude_paths?: string[];
  boost_paths?: string[];
}> = {
  'overstock.com': {
    privacy_url_pattern: 'help.overstock.com/support/s/article/Privacy',
    requires_js: true,
    exclude_paths: ['/c/', '/products/', '/category/']
  },
  'walmart.com': {
    requires_js: false,
    boost_paths: ['/help/article/', '/help/privacy']
  },
  'target.com': {
    requires_js: false,
    boost_paths: ['/help/', '/help/privacy', '/help/contact']
  }
};

export function getVendorHint(vendorKey?: string): VendorHint {
  return VENDOR_HINTS[vendorKey ?? ''] ?? VENDOR_HINTS.unknown;
}

export function getDomainHint(domain: string) {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return DOMAIN_HINTS[normalized] || null;
}

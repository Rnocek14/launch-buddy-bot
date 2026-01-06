// Login detection content script
// Injected into all pages to detect authentication events

const LOGIN_URL_PATTERNS = [
  '/login', '/signin', '/sign-in', '/sign_in',
  '/authenticate', '/auth', '/session',
  '/account/login', '/user/login', '/users/sign_in',
  '/oauth', '/sso',
];

const PASSWORD_FIELD_SELECTORS = [
  'input[type="password"]',
  'input[name*="password"]',
  'input[id*="password"]',
  'input[autocomplete="current-password"]',
  'input[autocomplete="new-password"]',
];

let hasDetectedLogin = false;

function getDomain(): string {
  return window.location.hostname.replace(/^www\./, '').toLowerCase();
}

function isLoginPage(): boolean {
  const path = window.location.pathname.toLowerCase();
  return LOGIN_URL_PATTERNS.some(pattern => path.includes(pattern));
}

function hasPasswordField(): boolean {
  return PASSWORD_FIELD_SELECTORS.some(selector => 
    document.querySelector(selector) !== null
  );
}

function sendLoginDetection(method: 'form' | 'oauth' | 'cookie' | 'url'): void {
  if (hasDetectedLogin) return;
  hasDetectedLogin = true;
  
  chrome.runtime.sendMessage({
    type: 'LOGIN_DETECTED',
    domain: getDomain(),
    detectionMethod: method,
  }).catch(() => {
    // Extension context may be invalidated
    hasDetectedLogin = false;
  });
}

// Method 1: Detect form submissions with password fields
function setupFormDetection(): void {
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const hasPassword = PASSWORD_FIELD_SELECTORS.some(selector => 
      form.querySelector(selector) !== null
    );
    
    if (hasPassword) {
      sendLoginDetection('form');
    }
  }, true);
  
  // Also detect clicks on submit buttons within forms with passwords
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest('button[type="submit"], input[type="submit"], button:not([type])');
    
    if (button) {
      const form = button.closest('form');
      if (form) {
        const hasPassword = PASSWORD_FIELD_SELECTORS.some(selector => 
          form.querySelector(selector) !== null
        );
        if (hasPassword) {
          sendLoginDetection('form');
        }
      }
    }
  }, true);
}

// Method 2: Detect URL-based login patterns
function checkLoginUrl(): void {
  if (isLoginPage() && hasPasswordField()) {
    // Don't immediately detect - wait for form submission
    // But track that we're on a login page
    console.debug('[Footprint Finder] Login page detected:', getDomain());
  }
}

// Method 3: Detect OAuth redirects
function setupOAuthDetection(): void {
  // Check URL for OAuth callback patterns
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  
  const oauthIndicators = ['code', 'access_token', 'id_token', 'state'];
  const hasOAuthParams = oauthIndicators.some(param => 
    params.has(param) || hash.has(param)
  );
  
  if (hasOAuthParams && (
    window.location.pathname.includes('callback') ||
    window.location.pathname.includes('oauth') ||
    window.location.pathname.includes('auth')
  )) {
    sendLoginDetection('oauth');
  }
}

// Method 4: Detect successful login by watching for redirects from login pages
function setupNavigationDetection(): void {
  let wasOnLoginPage = isLoginPage();
  
  // Use MutationObserver to detect SPA navigation
  const observer = new MutationObserver(() => {
    const isNowLoginPage = isLoginPage();
    
    // If we left a login page, assume successful login
    if (wasOnLoginPage && !isNowLoginPage && !hasPasswordField()) {
      sendLoginDetection('url');
    }
    
    wasOnLoginPage = isNowLoginPage;
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize detection
function init(): void {
  // Check if extension is enabled before running
  chrome.runtime.sendMessage({ type: 'GET_STATE' })
    .then((state) => {
      if (state?.detectionEnabled !== false) {
        setupFormDetection();
        checkLoginUrl();
        setupOAuthDetection();
        setupNavigationDetection();
      }
    })
    .catch(() => {
      // Extension context may be invalidated, skip detection
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

import type { ExtensionState, DetectedService } from '../src/types';

const contentEl = document.getElementById('content')!;

async function getState(): Promise<ExtensionState> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      resolve(response);
    });
  });
}

async function syncServices(): Promise<void> {
  const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement;
  if (syncBtn) {
    syncBtn.textContent = 'Syncing...';
    syncBtn.disabled = true;
  }
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'SYNC_SERVICES' }, async () => {
      await render();
      resolve();
    });
  });
}

async function toggleDetection(enabled: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_DETECTION', enabled }, () => {
      resolve();
    });
  });
}

function renderServicesList(services: DetectedService[]): string {
  if (services.length === 0) {
    return `
      <div class="services-list">
        <div class="services-header">
          <span>Detected Services</span>
          <span class="services-count">0</span>
        </div>
        <div class="empty-state">
          Browse the web and log into services.<br>
          They'll appear here automatically.
        </div>
      </div>
    `;
  }
  
  const recentServices = services
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 10);
  
  const serviceItems = recentServices.map(service => `
    <div class="service-item">
      <span class="service-domain">${service.domain}</span>
      <span class="service-badge ${service.synced ? 'badge-synced' : 'badge-pending'}">
        ${service.synced ? 'Synced' : 'Pending'}
      </span>
    </div>
  `).join('');
  
  const unsyncedCount = services.filter(s => !s.synced).length;
  
  return `
    <div class="services-list">
      <div class="services-header">
        <span>Detected Services</span>
        <span class="services-count">${services.length}</span>
      </div>
      ${serviceItems}
    </div>
    ${unsyncedCount > 0 ? `
      <button id="sync-btn" class="button button-primary">
        Sync ${unsyncedCount} service${unsyncedCount > 1 ? 's' : ''} to Dashboard
      </button>
    ` : ''}
  `;
}

function renderAuthenticatedView(state: ExtensionState): string {
  return `
    <div class="status-card">
      <div class="status-row">
        <span class="status-label">Connection</span>
        <span class="status-value status-connected">● Connected</span>
      </div>
      <div class="status-row">
        <span class="status-label">Detection</span>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="detection-toggle" ${state.detectionEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      ${state.lastSync ? `
        <div class="status-row">
          <span class="status-label">Last sync</span>
          <span class="status-value">${formatRelativeTime(state.lastSync)}</span>
        </div>
      ` : ''}
    </div>
    ${renderServicesList(state.detectedServices)}
    <button id="dashboard-btn" class="button button-secondary">
      View Full Dashboard
    </button>
  `;
}

function renderUnauthenticatedView(state: ExtensionState): string {
  return `
    <div class="status-card">
      <div class="status-row">
        <span class="status-label">Connection</span>
        <span class="status-value status-disconnected">● Not connected</span>
      </div>
      <div class="status-row">
        <span class="status-label">Detection</span>
        <div class="toggle-container">
          <label class="toggle">
            <input type="checkbox" id="detection-toggle" ${state.detectionEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
    ${renderServicesList(state.detectedServices)}
    <div class="auth-section">
      <p class="auth-message">
        Connect to your Footprint Finder account to sync detected services.
      </p>
      <button id="connect-btn" class="button button-primary">
        Connect Account
      </button>
    </div>
  `;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function render(): Promise<void> {
  const state = await getState();
  
  if (state.isAuthenticated) {
    contentEl.innerHTML = renderAuthenticatedView(state);
    
    // Add sync button listener
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', syncServices);
    }
    
    // Add dashboard button listener
    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://footprintfinder.app/dashboard' });
      });
    }
  } else {
    contentEl.innerHTML = renderUnauthenticatedView(state);
    
    // Add connect button listener
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://footprintfinder.app/auth?extension=true' });
      });
    }
  }
  
  // Add detection toggle listener
  const detectionToggle = document.getElementById('detection-toggle') as HTMLInputElement;
  if (detectionToggle) {
    detectionToggle.addEventListener('change', () => {
      toggleDetection(detectionToggle.checked);
    });
  }
}

// Initial render
render();

import type { DetectedService, ExtensionState } from '../types';

const STORAGE_KEYS = {
  STATE: 'footprint_finder_state',
  SERVICES: 'footprint_finder_services',
};

const DEFAULT_STATE: ExtensionState = {
  isAuthenticated: false,
  userId: null,
  accessToken: null,
  detectionEnabled: true,
  detectedServices: [],
  lastSync: null,
};

export async function getState(): Promise<ExtensionState> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.STATE, STORAGE_KEYS.SERVICES]);
  const state = result[STORAGE_KEYS.STATE] || DEFAULT_STATE;
  const services = result[STORAGE_KEYS.SERVICES] || [];
  return { ...state, detectedServices: services };
}

export async function setState(updates: Partial<ExtensionState>): Promise<void> {
  const current = await getState();
  const { detectedServices, ...stateWithoutServices } = { ...current, ...updates };
  
  await chrome.storage.local.set({
    [STORAGE_KEYS.STATE]: stateWithoutServices,
    [STORAGE_KEYS.SERVICES]: detectedServices,
  });
}

export async function addDetectedService(service: DetectedService): Promise<void> {
  const state = await getState();
  const existingIndex = state.detectedServices.findIndex(s => s.domain === service.domain);
  
  if (existingIndex >= 0) {
    // Update existing service
    state.detectedServices[existingIndex] = {
      ...state.detectedServices[existingIndex],
      lastSeen: service.lastSeen,
      synced: false, // Mark as needing sync
    };
  } else {
    // Add new service
    state.detectedServices.push(service);
  }
  
  await setState({ detectedServices: state.detectedServices });
}

export async function markServicesSynced(domains: string[]): Promise<void> {
  const state = await getState();
  state.detectedServices = state.detectedServices.map(service => 
    domains.includes(service.domain) ? { ...service, synced: true } : service
  );
  await setState({ detectedServices: state.detectedServices, lastSync: Date.now() });
}

export async function getUnsyncedServices(): Promise<DetectedService[]> {
  const state = await getState();
  return state.detectedServices.filter(s => !s.synced);
}

export async function clearAuth(): Promise<void> {
  await setState({
    isAuthenticated: false,
    userId: null,
    accessToken: null,
  });
}

export async function setAuth(userId: string, accessToken: string): Promise<void> {
  await setState({
    isAuthenticated: true,
    userId,
    accessToken,
  });
}

export async function toggleDetection(enabled: boolean): Promise<void> {
  await setState({ detectionEnabled: enabled });
}

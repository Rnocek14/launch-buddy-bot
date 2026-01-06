import type { MessagePayload, DetectedService } from './types';
import { getState, addDetectedService, setAuth, clearAuth, toggleDetection, getUnsyncedServices } from './lib/storage';
import { syncServicesToSupabase, verifyAuth } from './lib/supabase';

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Keep the message channel open for async response
});

async function handleMessage(message: MessagePayload): Promise<unknown> {
  switch (message.type) {
    case 'LOGIN_DETECTED':
      return handleLoginDetected(message.domain!, message.detectionMethod!);
    
    case 'GET_STATE':
      return getState();
    
    case 'SET_AUTH':
      if (message.accessToken) {
        const authResult = await verifyAuth(message.accessToken);
        if (authResult.valid && authResult.userId) {
          await setAuth(authResult.userId, message.accessToken);
          // Trigger sync after authentication
          const unsynced = await getUnsyncedServices();
          if (unsynced.length > 0) {
            await syncServicesToSupabase(unsynced);
          }
          return { success: true };
        }
        return { success: false, error: 'Invalid token' };
      }
      return { success: false, error: 'No token provided' };
    
    case 'CLEAR_AUTH':
      await clearAuth();
      return { success: true };
    
    case 'SYNC_SERVICES':
      const unsynced = await getUnsyncedServices();
      if (unsynced.length === 0) {
        return { success: true, syncedCount: 0 };
      }
      return syncServicesToSupabase(unsynced);
    
    case 'TOGGLE_DETECTION':
      if (typeof message.enabled === 'boolean') {
        await toggleDetection(message.enabled);
        return { success: true };
      }
      return { success: false, error: 'Invalid enabled value' };
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function handleLoginDetected(domain: string, detectionMethod: 'form' | 'oauth' | 'cookie' | 'url'): Promise<{ success: boolean }> {
  const state = await getState();
  
  if (!state.detectionEnabled) {
    return { success: false };
  }
  
  // Clean up the domain
  const cleanDomain = domain
    .replace(/^(www\.|app\.|my\.|login\.|auth\.|accounts?\.)/, '')
    .toLowerCase();
  
  // Skip common non-service domains
  const skipDomains = [
    'google.com', 'facebook.com', 'apple.com', // OAuth providers
    'localhost', '127.0.0.1', // Local development
    'chrome.google.com', 'extensions', // Browser internals
  ];
  
  if (skipDomains.some(skip => cleanDomain.includes(skip))) {
    return { success: false };
  }
  
  const service: DetectedService = {
    domain: cleanDomain,
    firstDetected: Date.now(),
    lastSeen: Date.now(),
    detectionMethod,
    synced: false,
  };
  
  await addDetectedService(service);
  
  // Update badge
  const unsynced = await getUnsyncedServices();
  chrome.action.setBadgeText({ text: unsynced.length > 0 ? String(unsynced.length) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  
  // Auto-sync if authenticated
  if (state.isAuthenticated && state.accessToken) {
    const syncResult = await syncServicesToSupabase([service]);
    if (syncResult.success) {
      chrome.action.setBadgeText({ text: '' });
    }
  }
  
  return { success: true };
}

// Initialize badge on install/update
chrome.runtime.onInstalled.addListener(async () => {
  const unsynced = await getUnsyncedServices();
  chrome.action.setBadgeText({ text: unsynced.length > 0 ? String(unsynced.length) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
});

import type { DetectedService, SyncResult } from '../types';
import { getState, markServicesSynced } from './storage';

const SUPABASE_URL = 'https://gqxkeezkajkiyjpnjgkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw';

export async function syncServicesToSupabase(services: DetectedService[]): Promise<SyncResult> {
  const state = await getState();
  
  if (!state.isAuthenticated || !state.accessToken || !state.userId) {
    return { success: false, syncedCount: 0, error: 'Not authenticated' };
  }
  
  try {
    const syncedDomains: string[] = [];
    
    for (const service of services) {
      // First, check if service already exists
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/user_services?user_id=eq.${state.userId}&domain=eq.${encodeURIComponent(service.domain)}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${state.accessToken}`,
          },
        }
      );
      
      const existing = await checkResponse.json();
      
      if (existing.length === 0) {
        // Insert new service
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_services`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: state.userId,
            domain: service.domain,
            service_name: service.serviceName || formatDomainAsName(service.domain),
            discovery_source: 'extension',
            detected_at: new Date(service.firstDetected).toISOString(),
          }),
        });
        
        if (insertResponse.ok) {
          syncedDomains.push(service.domain);
        }
      } else {
        // Already exists, mark as synced
        syncedDomains.push(service.domain);
      }
    }
    
    await markServicesSynced(syncedDomains);
    
    return { success: true, syncedCount: syncedDomains.length };
  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      syncedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function formatDomainAsName(domain: string): string {
  // Remove common prefixes and suffixes
  const name = domain
    .replace(/^(www\.|app\.|my\.|login\.|auth\.)/, '')
    .replace(/\.(com|org|net|io|co|app)$/, '');
  
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function verifyAuth(accessToken: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (response.ok) {
      const user = await response.json();
      return { valid: true, userId: user.id };
    }
    
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export interface DetectedService {
  domain: string;
  firstDetected: number;
  lastSeen: number;
  detectionMethod: 'form' | 'oauth' | 'cookie' | 'url';
  synced: boolean;
  serviceName?: string;
}

export interface ExtensionState {
  isAuthenticated: boolean;
  userId: string | null;
  accessToken: string | null;
  detectionEnabled: boolean;
  detectedServices: DetectedService[];
  lastSync: number | null;
}

export interface MessagePayload {
  type: 'LOGIN_DETECTED' | 'GET_STATE' | 'SET_AUTH' | 'CLEAR_AUTH' | 'SYNC_SERVICES' | 'TOGGLE_DETECTION';
  domain?: string;
  detectionMethod?: 'form' | 'oauth' | 'cookie' | 'url';
  accessToken?: string;
  userId?: string;
  enabled?: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: string;
}

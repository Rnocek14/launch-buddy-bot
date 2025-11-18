/**
 * Simple analytics/conversion tracking utility
 * Logs events to console and persists to database
 */

import { supabase } from "@/integrations/supabase/client";
import { TRACKING_EVENTS } from "@/config/pricing";

interface TrackingEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
}

export { TRACKING_EVENTS };

export async function trackEvent(event: string, properties?: Record<string, any>) {
  const trackingData: TrackingEvent = {
    event,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    },
  };

  // Log to console for debugging
  console.log('[ANALYTICS]', trackingData);

  // Persist to database via edge function (fire-and-forget)
  try {
    supabase.functions.invoke('log-analytics-event', {
      body: trackingData,
    }).catch((err) => {
      console.warn('[ANALYTICS] Failed to log event to database:', err);
    });
  } catch (err) {
    console.warn('[ANALYTICS] Error invoking log function:', err);
  }

  return trackingData;
}

export function trackConversion(
  event: string,
  userId: string,
  properties?: Record<string, any>
) {
  return trackEvent(event, {
    userId,
    ...properties,
  });
}

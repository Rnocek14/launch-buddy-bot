/**
 * Simple analytics/conversion tracking utility
 * Logs events to console for now, easy to extend to GA/Plausible later
 */

import { TRACKING_EVENTS } from "@/config/pricing";

interface TrackingEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
}

export { TRACKING_EVENTS };

export function trackEvent(event: string, properties?: Record<string, any>) {
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

  // TODO: Send to analytics service (GA, Plausible, etc.)
  // Example: window.gtag?.('event', event, properties);
  // Example: window.plausible?.(event, { props: properties });

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

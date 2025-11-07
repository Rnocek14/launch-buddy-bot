-- Clean up duplicate and useless contacts

-- Delete duplicate contacts (keep only the most recent verified one, or most recent if none verified)
DELETE FROM privacy_contacts
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (
        PARTITION BY service_id, contact_type, lower(value)
        ORDER BY verified DESC, created_at DESC
      ) as rn
    FROM privacy_contacts
  ) t
  WHERE rn > 1
);

-- Delete useless 'other' type contacts (homepage URLs, etc)
DELETE FROM privacy_contacts
WHERE contact_type = 'other';

-- Delete contacts with homepage URLs (just domain, no specific path)
DELETE FROM privacy_contacts
WHERE contact_type = 'form' AND (
  value ~ '^https?://[^/]+/?$' OR  -- Just domain with optional trailing slash
  value ~ '^www\.[^/]+/?$' OR      -- www.domain.com
  value ~ '^[^/]+\.[^/]+/?$'       -- domain.com
);
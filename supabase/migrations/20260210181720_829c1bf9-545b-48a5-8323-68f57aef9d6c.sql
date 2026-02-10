-- Clean hallucinated Overstock form URLs (overstock.com domain redirects to beyond.com)
DELETE FROM privacy_contacts 
WHERE id IN (
  '95b56751-7cea-4f9a-9725-cd3dee6ed243',
  'a75809cf-f07c-40fa-8dfa-3fd4e68c21ba',
  'f6b5a9b4-e86d-4c38-98b5-e7942193d259'
);

-- Deduplicate: keep oldest per (service_id, contact_type, lower(value))
DELETE FROM privacy_contacts pc
USING privacy_contacts pc2
WHERE pc.id > pc2.id
  AND pc.service_id = pc2.service_id
  AND pc.contact_type = pc2.contact_type
  AND lower(pc.value) = lower(pc2.value);
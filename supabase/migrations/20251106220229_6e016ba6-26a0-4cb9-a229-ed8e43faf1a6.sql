-- Insert default deletion request templates for GDPR (EU) and CCPA (US)

-- GDPR Deletion Request Template (EU)
INSERT INTO public.request_templates (
  name,
  template_type,
  jurisdiction,
  subject_template,
  body_template,
  legal_citations,
  requires_fields,
  is_active
) VALUES (
  'GDPR Right to Erasure Request',
  'gdpr',
  'EU',
  'GDPR Data Deletion Request - {{user_full_name}}',
  'Dear {{service_name}} Data Protection Officer,

I am writing to exercise my right to erasure under Article 17 of the General Data Protection Regulation (GDPR).

I request the complete deletion of all personal data you hold about me, including but not limited to:
- Account information and profile data
- Communication history and correspondence
- Usage data and analytics
- Any derived or inferred data

Account Identifier: {{account_identifier}}
Full Name: {{user_full_name}}
Email: {{user_email}}

Under GDPR Article 17, you are required to respond to this request without undue delay and within one month of receipt. Please confirm in writing once my data has been permanently deleted from all your systems, including backups.

If you are unable to comply with this request, please provide specific reasons as required under GDPR Article 12(4).

Thank you for your prompt attention to this matter.

Best regards,
{{user_full_name}}',
  ARRAY['GDPR Article 17 (Right to Erasure)', 'GDPR Article 12(3) (Response Timeline)'],
  ARRAY['user_full_name', 'user_email', 'account_identifier', 'service_name'],
  true
);

-- CCPA Deletion Request Template (US)
INSERT INTO public.request_templates (
  name,
  template_type,
  jurisdiction,
  subject_template,
  body_template,
  legal_citations,
  requires_fields,
  is_active
) VALUES (
  'CCPA Right to Delete Request',
  'ccpa',
  'US',
  'CCPA Data Deletion Request - {{user_full_name}}',
  'Dear {{service_name}} Privacy Team,

I am a California resident writing to exercise my right to deletion under the California Consumer Privacy Act (CCPA).

I request that you delete all personal information you have collected about me, including:
- Account information and personal identifiers
- Commercial information and transaction history
- Internet activity and usage data
- Any other categories of personal information

Account Identifier: {{account_identifier}}
Full Name: {{user_full_name}}
Email: {{user_email}}

Under CCPA Section 1798.105, you must delete my personal information from your records and direct any service providers to delete my personal information from their records. Please respond within 45 days as required by law.

Please confirm in writing once my data has been permanently deleted.

If you have reason to deny this request, please provide an explanation as required under CCPA regulations.

Thank you for your cooperation.

Sincerely,
{{user_full_name}}',
  ARRAY['CCPA Section 1798.105 (Right to Delete)', 'CCPA Section 1798.130 (Response Timeline)'],
  ARRAY['user_full_name', 'user_email', 'account_identifier', 'service_name'],
  true
);

-- Generic/International Deletion Request Template
INSERT INTO public.request_templates (
  name,
  template_type,
  jurisdiction,
  subject_template,
  body_template,
  legal_citations,
  requires_fields,
  is_active
) VALUES (
  'General Data Deletion Request',
  'general_deletion',
  'OTHER',
  'Data Deletion Request - {{user_full_name}}',
  'Dear {{service_name}} Team,

I am writing to request the deletion of my personal data from your systems.

I would like all my personal information removed, including:
- Account information and profile data
- Communication history
- Usage data and activity logs

Account Identifier: {{account_identifier}}
Full Name: {{user_full_name}}
Email: {{user_email}}

Please confirm once my data has been permanently deleted from your systems.

Thank you for your assistance.

Best regards,
{{user_full_name}}',
  ARRAY['Data protection best practices'],
  ARRAY['user_full_name', 'user_email', 'account_identifier', 'service_name'],
  true
);
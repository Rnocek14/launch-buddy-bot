// GDPR and CCPA compliant removal request templates

export interface RemovalTemplate {
  id: string;
  name: string;
  jurisdiction: "gdpr" | "ccpa" | "general";
  subject: string;
  body: string;
}

export interface TemplateVariables {
  fullName: string;
  email: string;
  address?: string;
  profileUrl?: string;
  serviceName: string;
  currentDate: string;
}

export const removalTemplates: RemovalTemplate[] = [
  {
    id: "gdpr-deletion",
    name: "GDPR Article 17 - Right to Erasure",
    jurisdiction: "gdpr",
    subject: "GDPR Data Erasure Request - Article 17",
    body: `Dear Data Protection Officer,

I am writing to request the erasure of my personal data under Article 17 of the General Data Protection Regulation (GDPR).

My details:
- Full Name: {{fullName}}
- Email: {{email}}
{{#if address}}- Address: {{address}}{{/if}}
{{#if profileUrl}}- Profile URL on your site: {{profileUrl}}{{/if}}

Under Article 17 of the GDPR, I have the right to request the erasure of my personal data without undue delay. I am exercising this right and requesting that you delete all personal data you hold about me.

Please confirm within 30 days that:
1. You have deleted all my personal data from your systems
2. You have instructed any third parties with whom you have shared my data to also delete it
3. You have stopped any further processing of my personal data

If you are unable to comply with this request, please provide me with a written explanation of your legal basis for continued processing within 30 days.

If I do not receive a satisfactory response, I will consider filing a complaint with the relevant supervisory authority.

Sincerely,
{{fullName}}
{{currentDate}}`,
  },
  {
    id: "ccpa-deletion",
    name: "CCPA Section 1798.105 - Right to Delete",
    jurisdiction: "ccpa",
    subject: "CCPA Personal Information Deletion Request",
    body: `To Whom It May Concern,

I am a California resident and I am writing to exercise my rights under the California Consumer Privacy Act (CCPA), specifically my right to deletion under Section 1798.105.

My details:
- Full Name: {{fullName}}
- Email: {{email}}
{{#if address}}- Address: {{address}}{{/if}}
{{#if profileUrl}}- Profile URL on your site: {{profileUrl}}{{/if}}

I request that {{serviceName}} delete any personal information you have collected about me.

Under CCPA Section 1798.105, you are required to:
1. Delete my personal information from your records
2. Direct any service providers to delete my personal information from their records
3. Confirm this deletion to me within 45 days

Please note that under CCPA, you may not discriminate against me for exercising my privacy rights.

If you need to verify my identity, please let me know what information you require.

Thank you for your prompt attention to this matter.

Sincerely,
{{fullName}}
{{currentDate}}`,
  },
  {
    id: "ccpa-do-not-sell",
    name: "CCPA Section 1798.120 - Do Not Sell My Data",
    jurisdiction: "ccpa",
    subject: "Do Not Sell My Personal Information - CCPA Request",
    body: `To Whom It May Concern,

I am a California resident and I am writing to exercise my right to opt out of the sale of my personal information under the California Consumer Privacy Act (CCPA), Section 1798.120.

My details:
- Full Name: {{fullName}}
- Email: {{email}}
{{#if address}}- Address: {{address}}{{/if}}
{{#if profileUrl}}- Profile URL on your site: {{profileUrl}}{{/if}}

I hereby direct {{serviceName}} to:
1. Stop selling my personal information to third parties immediately
2. Notify any third parties to whom you have sold my data in the last 12 months
3. Confirm this opt-out to me within 15 business days

Under CCPA Section 1798.120, you are prohibited from discriminating against me for exercising this right. This includes denying goods or services, charging different prices, or providing a different level of quality.

If you need to verify my identity, please let me know what information you require.

Thank you for your prompt attention to this matter.

Sincerely,
{{fullName}}
{{currentDate}}`,
  },
  {
    id: "general-optout",
    name: "General Opt-Out Request",
    jurisdiction: "general",
    subject: "Request to Remove My Personal Information",
    body: `Hello,

I am writing to request the removal of my personal information from your website/database.

My details:
- Full Name: {{fullName}}
- Email: {{email}}
{{#if address}}- Address: {{address}}{{/if}}
{{#if profileUrl}}- Profile URL: {{profileUrl}}{{/if}}

I did not consent to having my personal information published on your platform, and I request that you remove it immediately.

Please confirm that you have removed my information within 14 days.

Thank you for your cooperation.

Regards,
{{fullName}}
{{currentDate}}`,
  },
];

// Broker-specific opt-out instructions
export interface BrokerOptOutGuide {
  slug: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
  optOutUrl: string;
  requiresEmail: boolean;
  requiresPhone: boolean;
  requiresId: boolean;
  steps: string[];
}

export const brokerOptOutGuides: BrokerOptOutGuide[] = [
  {
    slug: "spokeo",
    name: "Spokeo",
    difficulty: "medium",
    estimatedTime: "3-5 minutes",
    optOutUrl: "https://www.spokeo.com/optout",
    requiresEmail: true,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Go to the Spokeo opt-out page",
      "Find your profile on Spokeo and copy the profile URL",
      "Paste your profile URL into the opt-out form",
      "Enter your email address",
      "Complete the CAPTCHA",
      "Click Submit - you'll receive a confirmation email",
      "Click the link in the confirmation email to complete removal",
    ],
  },
  {
    slug: "whitepages",
    name: "Whitepages",
    difficulty: "medium",
    estimatedTime: "5-7 minutes",
    optOutUrl: "https://www.whitepages.com/suppression-requests",
    requiresEmail: true,
    requiresPhone: true,
    requiresId: false,
    steps: [
      "Go to the Whitepages opt-out page",
      "Search for yourself and find your listing",
      "Copy the URL of your profile",
      "Paste the URL into the suppression request form",
      "Enter your phone number for verification",
      "You'll receive a verification call - note the code",
      "Enter the code to complete the opt-out",
    ],
  },
  {
    slug: "truepeoplesearch",
    name: "TruePeopleSearch",
    difficulty: "easy",
    estimatedTime: "2-3 minutes",
    optOutUrl: "https://www.truepeoplesearch.com/removal",
    requiresEmail: false,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Go to the TruePeopleSearch removal page",
      "Find your listing and click 'Remove This Record'",
      "Complete the CAPTCHA verification",
      "Your record will be removed within 24-48 hours",
    ],
  },
  {
    slug: "fastpeoplesearch",
    name: "FastPeopleSearch",
    difficulty: "easy",
    estimatedTime: "2-3 minutes",
    optOutUrl: "https://www.fastpeoplesearch.com/removal",
    requiresEmail: false,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Go to the FastPeopleSearch removal page",
      "Search for your listing",
      "Click 'Remove This Record'",
      "Complete the verification",
      "Your record will be removed within 24-48 hours",
    ],
  },
  {
    slug: "beenverified",
    name: "BeenVerified",
    difficulty: "hard",
    estimatedTime: "10-15 minutes",
    optOutUrl: "https://www.beenverified.com/f/optout/search",
    requiresEmail: true,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Go to the BeenVerified opt-out page",
      "Search for yourself using your name and state",
      "Find your listing and click on it",
      "Click 'Proceed to opt out'",
      "Enter your email address",
      "Verify your email by clicking the link sent to you",
      "Wait 24-48 hours for removal - check back to confirm",
    ],
  },
  {
    slug: "radaris",
    name: "Radaris",
    difficulty: "hard",
    estimatedTime: "15-20 minutes",
    optOutUrl: "https://radaris.com/control/privacy",
    requiresEmail: true,
    requiresPhone: false,
    requiresId: true,
    steps: [
      "Create a Radaris account (required for opt-out)",
      "Go to the Privacy Control page",
      "Search for your profile",
      "Select all records associated with you",
      "Request removal - you may need to verify your identity",
      "Check back in 24-48 hours to confirm removal",
    ],
  },
  {
    slug: "thatsthem",
    name: "That'sThem",
    difficulty: "easy",
    estimatedTime: "2-3 minutes",
    optOutUrl: "https://thatsthem.com/optout",
    requiresEmail: false,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Go to the That'sThem opt-out page",
      "Search for your listing",
      "Click 'Opt Out' next to your record",
      "Complete the CAPTCHA",
      "Your record will be removed within 24-48 hours",
    ],
  },
  {
    slug: "nuwber",
    name: "Nuwber",
    difficulty: "medium",
    estimatedTime: "5-7 minutes",
    optOutUrl: "https://nuwber.com/removal/link",
    requiresEmail: true,
    requiresPhone: false,
    requiresId: false,
    steps: [
      "Find your profile on Nuwber",
      "Copy the URL of your profile",
      "Go to the Nuwber removal page",
      "Paste your profile URL",
      "Enter your email address",
      "Complete the verification email",
      "Wait 24-48 hours for removal",
    ],
  },
];

export function fillTemplate(template: RemovalTemplate, variables: TemplateVariables): { subject: string; body: string } {
  let body = template.body;
  let subject = template.subject;

  // Replace all template variables
  const replacements: Record<string, string> = {
    "{{fullName}}": variables.fullName,
    "{{email}}": variables.email,
    "{{address}}": variables.address || "",
    "{{profileUrl}}": variables.profileUrl || "",
    "{{serviceName}}": variables.serviceName,
    "{{currentDate}}": variables.currentDate,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    body = body.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  // Handle conditional blocks
  // {{#if address}}...{{/if}}
  if (variables.address) {
    body = body.replace(/\{\{#if address\}\}(.*?)\{\{\/if\}\}/gs, "$1");
  } else {
    body = body.replace(/\{\{#if address\}\}.*?\{\{\/if\}\}/gs, "");
  }

  if (variables.profileUrl) {
    body = body.replace(/\{\{#if profileUrl\}\}(.*?)\{\{\/if\}\}/gs, "$1");
  } else {
    body = body.replace(/\{\{#if profileUrl\}\}.*?\{\{\/if\}\}/gs, "");
  }

  // Clean up extra blank lines
  body = body.replace(/\n{3,}/g, "\n\n").trim();

  return { subject, body };
}

export function getOptOutGuide(brokerSlug: string): BrokerOptOutGuide | undefined {
  return brokerOptOutGuides.find((g) => g.slug === brokerSlug.toLowerCase());
}

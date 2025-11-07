import { AlertCircle, ExternalLink, Mail, FileText, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServiceGuide {
  industry: string;
  commonLocations: string[];
  emailPatterns: string[];
  formKeywords: string[];
  tips: string[];
}

const getIndustryFromDomain = (domain: string): string => {
  const lower = domain.toLowerCase();
  
  if (/(airline|airways|air|flight)/i.test(lower)) return "airline";
  if (/(bank|financial|credit|insurance)/i.test(lower)) return "financial";
  if (/(shop|store|retail|ecommerce|market)/i.test(lower)) return "retail";
  if (/(tech|software|cloud|app|digital)/i.test(lower)) return "tech";
  if (/(hotel|resort|booking|travel)/i.test(lower)) return "hospitality";
  if (/(health|medical|hospital|clinic)/i.test(lower)) return "healthcare";
  
  return "general";
};

const industryGuides: Record<string, ServiceGuide> = {
  airline: {
    industry: "Airlines",
    commonLocations: [
      "Privacy Policy page (usually in footer)",
      "Customer Service section",
      "Legal or Terms section",
      "Contact Us page under 'Data Protection'",
    ],
    emailPatterns: ["privacy@", "dpo@", "dataprotection@", "legal@"],
    formKeywords: ["data request", "privacy request", "GDPR", "data rights", "delete account"],
    tips: [
      "Airlines often use forms rather than email addresses",
      "Look for 'Your Privacy Rights' or 'Data Subject Requests' sections",
      "Check if they have a dedicated data protection officer (DPO) contact",
    ],
  },
  financial: {
    industry: "Financial Services",
    commonLocations: [
      "Privacy Center or Privacy Policy page",
      "Security & Privacy section",
      "Footer under 'Legal' or 'Compliance'",
      "Account settings (when logged in)",
    ],
    emailPatterns: ["privacy@", "compliance@", "dpo@", "dataprotection@"],
    formKeywords: ["privacy request", "data access", "CCPA", "GDPR", "consumer rights"],
    tips: [
      "Financial institutions take privacy seriously - usually have dedicated teams",
      "May require login to access privacy request forms",
      "Often have separate forms for different request types (access, deletion, etc.)",
    ],
  },
  retail: {
    industry: "Retail & E-commerce",
    commonLocations: [
      "Footer - Privacy Policy link",
      "Account Settings - Privacy section",
      "Help Center or FAQ",
      "Contact page",
    ],
    emailPatterns: ["privacy@", "support@", "help@", "customercare@"],
    formKeywords: ["data request", "delete account", "privacy rights", "do not sell"],
    tips: [
      "Retailers often provide email addresses in privacy policies",
      "Look for 'Your Privacy Choices' or 'Do Not Sell My Info' links",
      "Account deletion options may be in account settings",
    ],
  },
  tech: {
    industry: "Technology Companies",
    commonLocations: [
      "Privacy Center (often dedicated subdomain)",
      "Account Settings - Privacy & Security",
      "Developer or API documentation",
      "Footer - Privacy or Legal links",
    ],
    emailPatterns: ["privacy@", "dpo@", "legal@", "support@"],
    formKeywords: ["data download", "delete account", "privacy dashboard", "data request"],
    tips: [
      "Tech companies often have self-service privacy dashboards",
      "May have dedicated privacy centers (privacy.company.com)",
      "Look for 'Download Your Data' or 'Manage Privacy' options",
    ],
  },
  hospitality: {
    industry: "Hospitality & Travel",
    commonLocations: [
      "Privacy Policy in footer",
      "Guest Services or Contact section",
      "Booking management area",
      "Terms & Conditions pages",
    ],
    emailPatterns: ["privacy@", "guestservices@", "dataprotection@"],
    formKeywords: ["privacy request", "data access", "guest information"],
    tips: [
      "Hotels often provide email contacts in privacy policies",
      "May have regional privacy contacts (US, EU, etc.)",
      "Booking platforms may have centralized privacy forms",
    ],
  },
  healthcare: {
    industry: "Healthcare",
    commonLocations: [
      "Privacy Policy or HIPAA Notice",
      "Patient Portal",
      "Contact Us - Privacy Officer",
      "Footer - Legal/Compliance section",
    ],
    emailPatterns: ["privacy@", "hipaa@", "compliance@", "privacyofficer@"],
    formKeywords: ["patient rights", "medical records", "HIPAA request", "privacy request"],
    tips: [
      "Healthcare has strict HIPAA requirements - usually have dedicated privacy officers",
      "May need to submit requests through patient portal",
      "Often require identity verification for privacy requests",
    ],
  },
  general: {
    industry: "General",
    commonLocations: [
      "Website footer - Privacy Policy link",
      "Contact Us page",
      "About page - Legal section",
      "Help or Support Center",
    ],
    emailPatterns: ["privacy@", "legal@", "support@", "info@", "contact@"],
    formKeywords: ["privacy", "data request", "contact form", "GDPR", "CCPA"],
    tips: [
      "Start with the Privacy Policy - it should list contact methods",
      "Check the footer of every page for privacy links",
      "Look for 'Your Privacy Rights' or 'Data Protection' sections",
    ],
  },
};

interface ServiceTypeGuidesProps {
  serviceName: string;
  domain: string;
  contactType?: "email" | "form" | "phone";
}

export const ServiceTypeGuides = ({ serviceName, domain, contactType }: ServiceTypeGuidesProps) => {
  const industry = getIndustryFromDomain(domain);
  const guide = industryGuides[industry];

  const getIcon = () => {
    switch (contactType) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "form":
        return <FileText className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getContactSpecificTips = () => {
    switch (contactType) {
      case "email":
        return (
          <>
            <p className="font-medium text-sm mb-2">Common email patterns for {guide.industry}:</p>
            <ul className="text-xs space-y-1 mb-3">
              {guide.emailPatterns.map((pattern, i) => (
                <li key={i}>• {pattern}{domain}</li>
              ))}
            </ul>
          </>
        );
      case "form":
        return (
          <>
            <p className="font-medium text-sm mb-2">Look for forms with these keywords:</p>
            <ul className="text-xs space-y-1 mb-3">
              {guide.formKeywords.map((keyword, i) => (
                <li key={i}>• "{keyword}"</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mb-2">
              💡 <strong>You don't need to fill out the form</strong> - just find it and copy the URL!
            </p>
          </>
        );
      case "phone":
        return (
          <p className="text-sm mb-2">
            Look for privacy-specific phone numbers (not general customer service).
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 space-y-3">
          <AlertDescription className="text-blue-900">
            <p className="font-semibold mb-3">Finding {contactType || "privacy contacts"} for {serviceName}</p>
            
            {getContactSpecificTips()}
            
            <p className="font-medium text-sm mb-2">Where to look:</p>
            <ul className="text-xs space-y-1 mb-3">
              {guide.commonLocations.map((location, i) => (
                <li key={i}>• {location}</li>
              ))}
            </ul>
            
            <p className="font-medium text-sm mb-2">Helpful tips:</p>
            <ul className="text-xs space-y-1">
              {guide.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

// Email provider factory
import { EmailProvider, ProviderType } from './types.ts';
import { GmailProvider } from './gmail.ts';
import { OutlookProvider } from './outlook.ts';

export function getEmailProvider(provider: ProviderType): EmailProvider {
  switch (provider) {
    case 'gmail':
      return new GmailProvider();
    case 'outlook':
      return new OutlookProvider();
    default:
      throw new Error(`Unsupported email provider: ${provider}`);
  }
}

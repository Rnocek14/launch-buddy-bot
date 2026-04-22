export interface AIContactFinding {
  contact_type: 'email' | 'form' | 'phone';
  value: string;
  confidence: 'high' | 'medium';
  reasoning: string;
}

export interface AIContactValidationResult {
  validContacts: AIContactFinding[];
  rejectedContacts: Array<{ contact: AIContactFinding; reason: string }>;
  warnings: string[];
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();
}

export function extractJSON(raw: string): any {
  let cleaned = stripMarkdownFences(raw);

  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const objStart = cleaned.indexOf('{');
    const arrStart = cleaned.indexOf('[');
    const isArray = arrStart !== -1 && (objStart === -1 || arrStart < objStart);
    const start = isArray ? arrStart : objStart;
    const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');

    if (start !== -1 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    } else {
      throw new Error('No valid JSON found in AI response');
    }
  }

  return JSON.parse(cleaned);
}

function normalizeContactShape(input: unknown): AIContactFinding[] {
  const contacts = Array.isArray(input)
    ? input
    : Array.isArray((input as { contacts?: unknown[] })?.contacts)
      ? (input as { contacts?: unknown[] }).contacts ?? []
      : [];

  return contacts.flatMap((contact) => {
    if (!contact || typeof contact !== 'object') return [];
    const candidate = contact as Record<string, unknown>;
    const contact_type = String(candidate.contact_type ?? '').toLowerCase();
    const value = String(candidate.value ?? '').trim();
    const confidence = String(candidate.confidence ?? '').toLowerCase();
    const reasoning = String(candidate.reasoning ?? '').trim();

    if (!['email', 'form', 'phone'].includes(contact_type)) return [];
    if (!['high', 'medium'].includes(confidence)) return [];
    if (!value || !reasoning) return [];

    return [{
      contact_type: contact_type as AIContactFinding['contact_type'],
      value,
      confidence: confidence as AIContactFinding['confidence'],
      reasoning,
    }];
  });
}

export function parseAIContactsResponse(result: any, maxTokens: number): { contacts: AIContactFinding[]; warnings: string[] } {
  const finishReason = result?.choices?.[0]?.finish_reason || result?.stop_reason || null;
  if (finishReason === 'length' || finishReason === 'max_tokens') {
    throw new Error('AI response truncated before completion');
  }

  const warnings: string[] = [];
  const outputTokens = result?.usage?.completion_tokens ?? result?.usage?.output_tokens ?? null;
  if (typeof outputTokens === 'number' && maxTokens > 0 && outputTokens >= maxTokens * 0.95) {
    warnings.push('near_token_limit');
  }

  const toolArgs = result?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (toolArgs) {
    return { contacts: normalizeContactShape(extractJSON(toolArgs)), warnings };
  }

  const rawContent = result?.choices?.[0]?.message?.content ?? result?.content;
  if (!rawContent) {
    return { contacts: [], warnings };
  }

  const contentString = Array.isArray(rawContent)
    ? rawContent.map((part) => typeof part?.text === 'string' ? part.text : '').join('\n')
    : String(rawContent);

  return { contacts: normalizeContactShape(extractJSON(contentString)), warnings };
}

export function validateAIContacts(contacts: AIContactFinding[], sourceText: string): AIContactValidationResult {
  const validContacts: AIContactFinding[] = [];
  const rejectedContacts: Array<{ contact: AIContactFinding; reason: string }> = [];
  const warnings: string[] = [];

  const normalizedSource = sourceText.toLowerCase();
  const sourceNoWhitespace = normalizedSource.replace(/\s+/g, '');
  const sourceDigits = sourceText.replace(/\D+/g, '');

  for (const contact of contacts) {
    if (contact.contact_type === 'email') {
      const email = contact.value.toLowerCase();
      if (!normalizedSource.includes(email) && !sourceNoWhitespace.includes(email.replace(/\s+/g, ''))) {
        rejectedContacts.push({ contact, reason: 'email_not_present_in_source' });
        continue;
      }
    }

    if (contact.contact_type === 'form') {
      const value = contact.value.toLowerCase();
      if (!normalizedSource.includes(value)) {
        rejectedContacts.push({ contact, reason: 'form_url_not_present_in_source' });
        continue;
      }
    }

    if (contact.contact_type === 'phone') {
      const digits = contact.value.replace(/\D+/g, '');
      if (digits.length < 7 || !sourceDigits.includes(digits)) {
        rejectedContacts.push({ contact, reason: 'phone_not_present_in_source' });
        continue;
      }
    }

    const reasoningStart = contact.reasoning.slice(0, 80).trim().toLowerCase().replace(/\s+/g, ' ');
    if (reasoningStart && !normalizedSource.replace(/\s+/g, ' ').includes(reasoningStart)) {
      warnings.push(`reasoning_may_be_paraphrased:${contact.contact_type}:${contact.value}`);
    }

    validContacts.push(contact);
  }

  return { validContacts, rejectedContacts, warnings };
}
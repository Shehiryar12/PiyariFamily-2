export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export type HelpLegalDoc = {
  title: string;
  content: string;
  html: string;
};

export type FaqsResponse = {
  success?: boolean | number;
  message?: string;
  faqs?: unknown;
  data?: unknown;
};

export type LegalDocResponse = {
  success?: boolean | number;
  message?: string;
  data?: unknown;
  content?: string;
  body?: string;
  html?: string;
  text?: string;
  title?: string;
};

const asObject = (value: unknown): Record<string, any> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const stripHtml = (value: string) =>
  value
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractList = (response?: FaqsResponse | null): unknown[] => {
  const root = asObject(response) ?? {};
  const data = root.data;

  if (Array.isArray(data)) {
    return data;
  }

  const nested = asObject(data);
  const candidates = [
    nested?.faqs,
    nested?.faq,
    nested?.items,
    nested?.questions,
    nested?.data,
    root.faqs,
    root.faq,
    root.items,
    root.questions,
  ];

  return candidates.find(Array.isArray) ?? [];
};

export const mapFaqs = (response?: FaqsResponse | null): HelpFaqItem[] =>
  extractList(response).flatMap((item, index) => {
    const row = asObject(item);
    if (!row) {
      return [];
    }

    const question = pickString(
      row.question,
      row.title,
      row.heading,
      row.name,
    );
    const answer = stripHtml(
      pickString(row.answer, row.content, row.body, row.description, row.html),
    );

    if (!question || !answer) {
      return [];
    }

    return [
      {
        id: pickString(row.id, row.slug, `faq-${index}`) || `faq-${index}`,
        question,
        answer,
        category: pickString(row.category, row.group, row.type).toLowerCase(),
      },
    ];
  });

export const mapLegalDoc = (
  response?: LegalDocResponse | null,
  fallbackTitle = '',
): HelpLegalDoc => {
  const root = asObject(response) ?? {};
  const nested = asObject(root.data) ?? root;
  const raw = pickString(
    nested.content,
    nested.body,
    nested.html,
    nested.text,
    nested.description,
    nested.policy,
    nested.terms,
    root.content,
    root.body,
    root.html,
    root.text,
  );

  return {
    title:
      pickString(nested.title, nested.name, nested.heading, root.title) ||
      fallbackTitle,
    content: stripHtml(raw),
    html: raw,
  };
};

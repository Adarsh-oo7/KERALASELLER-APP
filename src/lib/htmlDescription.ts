const ALLOWED_TAGS = new Set([
  'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h2', 'h3',
]);

const STYLE_KEYS = new Set(['font-size', 'font-weight', 'font-style', 'text-decoration', 'text-align']);

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pickStyle(attrs: string): string {
  const match = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
  const raw = match?.[2] ?? match?.[3] ?? '';
  const kept: string[] = [];
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.split(':');
    const name = key?.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (!name || !value || !STYLE_KEYS.has(name)) continue;
    if (/expression|url\s*\(|javascript/i.test(value)) continue;
    kept.push(`${name}: ${value}`);
  }
  return kept.join('; ');
}

export function sanitizeDescriptionHtml(input: string): string {
  if (!input) return '';
  let html = String(input)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (full.startsWith('</')) return `</${name}>`;
    if (name === 'br') return '<br>';
    const style = pickStyle(attrs || '');
    return style ? `<${name} style="${style}">` : `<${name}>`;
  });

  return html.trim();
}

export function plainTextFromHtml(html: string): string {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h2|h3)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export function descriptionIsEmpty(html: string): boolean {
  return plainTextFromHtml(html).length < 8;
}

export function toEditorHtml(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '<p><br></p>';
  if (!/<\/?[a-z][\s\S]*>/i.test(raw)) {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped
      .split(/\n+/)
      .map((line) => `<p>${line || '<br>'}</p>`)
      .join('');
  }
  return sanitizeDescriptionHtml(raw) || '<p><br></p>';
}

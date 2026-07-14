/**
 * 把 Payload Lexical rich text JSON 渲染成 HTML
 * 處理節點：paragraph, heading, text（含 bold/italic/underline）、
 * list/listitem、quote、hr、link/autolink、upload（圖片）、table。
 */

export type LexicalText = {
  type: 'text';
  text: string;
  format?: number; // bitmask: 1=bold 2=italic 8=underline 16=strikethrough 32=code
};

export type LexicalLinkFields = {
  url?: string;
  newTab?: boolean;
};

export type LexicalUploadValue = {
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type LexicalNode =
  | { type: 'paragraph'; children: LexicalNode[] }
  | { type: 'heading'; tag: string; children: LexicalNode[] }
  | { type: 'list'; listType: 'bullet' | 'number'; children: LexicalNode[] }
  | { type: 'listitem'; children: LexicalNode[] }
  | { type: 'quote'; children: LexicalNode[] }
  | { type: 'horizontalrule' }
  | { type: 'link' | 'autolink'; fields?: LexicalLinkFields; children: LexicalNode[] }
  | { type: 'upload' | 'image'; value?: LexicalUploadValue }
  | { type: 'table'; children: LexicalNode[] }
  | { type: 'tablerow'; children: LexicalNode[] }
  | { type: 'tablecell'; children: LexicalNode[]; headerState?: number }
  | LexicalText;

export type LexicalRoot = { root: { children: LexicalNode[] } };

export function renderText(node: LexicalText): string {
  let t = node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (!node.format) return t;
  if (node.format & 1) t = `<strong>${t}</strong>`;
  if (node.format & 2) t = `<em>${t}</em>`;
  if (node.format & 8) t = `<u>${t}</u>`;
  if (node.format & 16) t = `<s>${t}</s>`;
  if (node.format & 32) t = `<code>${t}</code>`;
  return t;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 僅放行 http(s) / mailto / 站內相對路徑；其餘（含 javascript:）視為不安全，回傳 null。 */
function sanitizeHref(raw: string | undefined): string | null {
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.startsWith('http:') || lower.startsWith('https:') || lower.startsWith('mailto:')) {
    return url;
  }
  // 站內相對路徑（含 hash / query），不含 scheme
  if (/^[/#?]/.test(url)) return url;
  return null;
}

function isExternalHref(href: string): boolean {
  return /^https?:/i.test(href);
}

function renderInlineMarkdown(text: string): string {
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = '';
  let cursor = 0;
  for (const match of text.matchAll(linkRe)) {
    const index = match.index ?? 0;
    html += renderText({ type: 'text', text: text.slice(cursor, index) });
    const label = renderText({ type: 'text', text: match[1] ?? '' });
    const href = sanitizeHref(match[2]);
    if (!href) {
      html += renderText({ type: 'text', text: match[0] });
    } else {
      const external = isExternalHref(href);
      const relAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      html += `<a href="${escapeAttr(href)}"${relAttr}>${label}</a>`;
    }
    cursor = index + match[0].length;
  }
  html += renderText({ type: 'text', text: text.slice(cursor) });
  return html;
}

function markdownTable(text: string): string | null {
  if (!text.trim().startsWith('|')) return null;

  // AI 初譯有時會把原本的換行壓成「| |」。先恢復列邊界，再驗證第二列
  // 是否為 Markdown 的 --- 分隔列，避免把一般含 pipe 的段落誤判成表格。
  const lines = text
    .trim()
    .replace(/\s*\|\s+\|\s*/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = lines.map((line) =>
    line
      .replace(/^\|\s*/, '')
      .replace(/\s*\|$/, '')
      .split('|')
      .map((cell) => cell.trim()),
  );
  if (rows.length < 3 || rows[0].length < 2) return null;
  if (!rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  const width = rows[0].length;
  if (rows.slice(2).some((row) => row.length !== width)) return null;

  const head = `<thead><tr>${rows[0].map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${rows
    .slice(2)
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  return `<table>${head}${body}</table>`;
}

function markdownList(text: string): string | null {
  const trimmed = text.trim();
  const bullet = /^[-*+]\s+/.test(trimmed);
  const numbered = /^\d+[.)]\s+/.test(trimmed);
  if (!bullet && !numbered) return null;

  const boundary = bullet ? /\s+(?=[-*+]\s+)/ : /\s+(?=\d+[.)]\s+)/;
  const items = trimmed
    .replace(/\r/g, '')
    .split(/\n+|(?<=\S) {1,}(?=[-*+]\s+|\d+[.)]\s+)/)
    .flatMap((line) => line.split(boundary))
    .map((item) => item.replace(bullet ? /^[-*+]\s+/ : /^\d+[.)]\s+/, '').trim())
    .filter(Boolean);
  if (items.length === 0) return null;
  const tag = numbered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</${tag}>`;
}

function renderMarkdownParagraph(node: Extract<LexicalNode, { type: 'paragraph' }>): string | null {
  if (node.children.length !== 1) return null;
  const child = node.children[0];
  if (child.type !== 'text' || child.format) return null;
  return markdownTable(child.text) ?? markdownList(child.text);
}

const warnedUnknownTypes = new Set<string>();

function warnUnknownNodeType(type: string): void {
  if (warnedUnknownTypes.has(type)) return;
  warnedUnknownTypes.add(type);
  console.warn(`[lexical] 未知節點型別 "${type}"，內容可能未完整渲染`);
}

export function renderChildren(nodes: LexicalNode[]): string {
  return nodes.map(renderNode).join('');
}

export function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node);
    case 'paragraph':
      return renderMarkdownParagraph(node) ?? `<p>${renderChildren(node.children)}</p>`;
    case 'heading':
      return `<${node.tag}>${renderChildren(node.children)}</${node.tag}>`;
    case 'list': {
      const tag = node.listType === 'number' ? 'ol' : 'ul';
      return `<${tag}>${renderChildren(node.children)}</${tag}>`;
    }
    case 'listitem':
      return `<li>${renderChildren(node.children)}</li>`;
    case 'quote':
      return `<blockquote>${renderChildren(node.children)}</blockquote>`;
    case 'horizontalrule':
      return `<hr />`;
    case 'link':
    case 'autolink': {
      const inner = renderChildren(node.children ?? []);
      const href = sanitizeHref(node.fields?.url);
      if (!href) return inner; // 不安全或缺失 href：退化為純文字
      const external = node.fields?.newTab || isExternalHref(href);
      const relAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeAttr(href)}"${relAttr}>${inner}</a>`;
    }
    case 'upload':
    case 'image': {
      const v = node.value;
      if (!v?.url) return '';
      const alt = escapeAttr(v.alt ?? '');
      const dims =
        typeof v.width === 'number' && typeof v.height === 'number'
          ? ` width="${v.width}" height="${v.height}"`
          : '';
      return `<img src="${escapeAttr(v.url)}" alt="${alt}" loading="lazy" decoding="async"${dims} />`;
    }
    case 'table':
      return `<table>${renderChildren(node.children ?? [])}</table>`;
    case 'tablerow':
      return `<tr>${renderChildren(node.children ?? [])}</tr>`;
    case 'tablecell': {
      const tag = node.headerState ? 'th' : 'td';
      return `<${tag}>${renderChildren(node.children ?? [])}</${tag}>`;
    }
    default:
      warnUnknownNodeType((node as { type?: string }).type ?? 'unknown');
      if ('children' in node) return renderChildren((node as { children?: LexicalNode[] }).children ?? []);
      return '';
  }
}

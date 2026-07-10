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
      return `<p>${renderChildren(node.children)}</p>`;
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

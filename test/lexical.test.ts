import { describe, it, expect, vi } from 'vitest';
import { renderText, renderNode, renderChildren, type LexicalNode, type LexicalText } from '../src/lib/lexical';

describe('renderText', () => {
  it('escapes < and & in plain text', () => {
    const node: LexicalText = { type: 'text', text: 'a < b & c' };
    expect(renderText(node)).toBe('a &lt; b &amp; c');
  });

  it('escapes > as well', () => {
    const node: LexicalText = { type: 'text', text: 'a > b' };
    expect(renderText(node)).toBe('a &gt; b');
  });

  it('applies bold for format bit 1', () => {
    expect(renderText({ type: 'text', text: 'x', format: 1 })).toBe('<strong>x</strong>');
  });

  it('applies italic for format bit 2', () => {
    expect(renderText({ type: 'text', text: 'x', format: 2 })).toBe('<em>x</em>');
  });

  it('applies underline for format bit 8', () => {
    expect(renderText({ type: 'text', text: 'x', format: 8 })).toBe('<u>x</u>');
  });

  it('applies strikethrough for format bit 16', () => {
    expect(renderText({ type: 'text', text: 'x', format: 16 })).toBe('<s>x</s>');
  });

  it('applies code for format bit 32', () => {
    expect(renderText({ type: 'text', text: 'x', format: 32 })).toBe('<code>x</code>');
  });

  it('composes bold + italic for combined bitmask', () => {
    // format 3 = bold (1) | italic (2); order of application is bold-out then italic-out
    expect(renderText({ type: 'text', text: 'x', format: 3 })).toBe('<em><strong>x</strong></em>');
  });

  it('returns plain text unchanged when format is 0/undefined', () => {
    expect(renderText({ type: 'text', text: 'plain' })).toBe('plain');
  });
});

describe('renderNode structure', () => {
  it('wraps paragraph children in <p>', () => {
    const node: LexicalNode = {
      type: 'paragraph',
      children: [{ type: 'text', text: 'hello' }],
    };
    expect(renderNode(node)).toBe('<p>hello</p>');
  });

  it('wraps heading children in the given tag', () => {
    const node: LexicalNode = {
      type: 'heading',
      tag: 'h2',
      children: [{ type: 'text', text: 'Title' }],
    };
    expect(renderNode(node)).toBe('<h2>Title</h2>');
  });

  it('renders a bullet list as <ul> with <li> items', () => {
    const node: LexicalNode = {
      type: 'list',
      listType: 'bullet',
      children: [
        { type: 'listitem', children: [{ type: 'text', text: 'one' }] },
        { type: 'listitem', children: [{ type: 'text', text: 'two' }] },
      ],
    };
    expect(renderNode(node)).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders a numbered list as <ol>', () => {
    const node: LexicalNode = {
      type: 'list',
      listType: 'number',
      children: [{ type: 'listitem', children: [{ type: 'text', text: 'one' }] }],
    };
    expect(renderNode(node)).toBe('<ol><li>one</li></ol>');
  });

  it('renders a quote as <blockquote>', () => {
    const node: LexicalNode = {
      type: 'quote',
      children: [{ type: 'text', text: 'quoted' }],
    };
    expect(renderNode(node)).toBe('<blockquote>quoted</blockquote>');
  });

  it('renders a horizontal rule as a self-closing <hr />', () => {
    expect(renderNode({ type: 'horizontalrule' })).toBe('<hr />');
  });

  it('renders an unknown node type by falling through to its children', () => {
    const node = { type: 'weirdnode', children: [{ type: 'text', text: 'fallback' }] } as unknown as LexicalNode;
    expect(renderNode(node)).toBe('fallback');
  });

  it('renders an unknown, childless node type as empty string without throwing', () => {
    const node = { type: 'linebreak' } as unknown as LexicalNode;
    expect(() => renderNode(node)).not.toThrow();
    expect(renderNode(node)).toBe('');
  });

  it('warns once (per type) when encountering an unknown node type', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const node = { type: 'somethingnew', children: [] } as unknown as LexicalNode;
    renderNode(node);
    renderNode(node);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('somethingnew');
    warnSpy.mockRestore();
  });
});

describe('renderNode link/autolink', () => {
  it('renders an http link with rel/target for external URLs', () => {
    const node: LexicalNode = {
      type: 'link',
      fields: { url: 'https://example.com' },
      children: [{ type: 'text', text: 'example' }],
    };
    expect(renderNode(node)).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">example</a>',
    );
  });

  it('renders a relative link without target/rel', () => {
    const node: LexicalNode = {
      type: 'link',
      fields: { url: '/blog/hello' },
      children: [{ type: 'text', text: 'hello' }],
    };
    expect(renderNode(node)).toBe('<a href="/blog/hello">hello</a>');
  });

  it('renders a mailto: link', () => {
    const node: LexicalNode = {
      type: 'link',
      fields: { url: 'mailto:a@b.com' },
      children: [{ type: 'text', text: 'mail' }],
    };
    expect(renderNode(node)).toBe('<a href="mailto:a@b.com">mail</a>');
  });

  it('rejects javascript: URLs, falling back to plain text', () => {
    const node: LexicalNode = {
      type: 'link',
      fields: { url: 'javascript:alert(1)' },
      children: [{ type: 'text', text: 'evil' }],
    };
    expect(renderNode(node)).toBe('evil');
  });

  it('treats autolink the same as link', () => {
    const node: LexicalNode = {
      type: 'autolink',
      fields: { url: 'https://example.com', newTab: true },
      children: [{ type: 'text', text: 'ex' }],
    };
    expect(renderNode(node)).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">ex</a>',
    );
  });

  it('falls back to plain text when the href is missing', () => {
    const node = { type: 'link', fields: {}, children: [{ type: 'text', text: 'no href' }] } as unknown as LexicalNode;
    expect(renderNode(node)).toBe('no href');
  });
});

describe('renderNode upload/image', () => {
  it('renders an <img> with alt, lazy loading and dimensions', () => {
    const node: LexicalNode = {
      type: 'upload',
      value: { url: '/media/photo.jpg', alt: 'a photo', width: 800, height: 600 },
    };
    expect(renderNode(node)).toBe(
      '<img src="/media/photo.jpg" alt="a photo" loading="lazy" decoding="async" width="800" height="600" />',
    );
  });

  it('omits width/height when dimensions are missing', () => {
    const node: LexicalNode = { type: 'upload', value: { url: '/media/photo.jpg' } };
    expect(renderNode(node)).toBe('<img src="/media/photo.jpg" alt="" loading="lazy" decoding="async" />');
  });

  it('renders empty string when the upload value/url is missing', () => {
    const node = { type: 'upload' } as unknown as LexicalNode;
    expect(renderNode(node)).toBe('');
  });
});

describe('renderNode table', () => {
  it('renders a basic table with header and data cells', () => {
    const node: LexicalNode = {
      type: 'table',
      children: [
        {
          type: 'tablerow',
          children: [
            { type: 'tablecell', headerState: 1, children: [{ type: 'text', text: 'H1' }] },
          ],
        },
        {
          type: 'tablerow',
          children: [
            { type: 'tablecell', children: [{ type: 'text', text: 'd1' }] },
          ],
        },
      ],
    };
    expect(renderNode(node)).toBe(
      '<table><tr><th>H1</th></tr><tr><td>d1</td></tr></table>',
    );
  });
});

describe('renderChildren', () => {
  it('concatenates multiple sibling nodes', () => {
    const nodes: LexicalNode[] = [
      { type: 'paragraph', children: [{ type: 'text', text: 'a' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'b' }] },
    ];
    expect(renderChildren(nodes)).toBe('<p>a</p><p>b</p>');
  });

  it('recovers a flattened Markdown bullet list from a translated paragraph', () => {
    const nodes: LexicalNode[] = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '- First item - Second item - Third item' }],
      },
    ];
    expect(renderChildren(nodes)).toBe('<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>');
  });

  it('recovers a flattened Markdown table and keeps safe links', () => {
    const nodes: LexicalNode[] = [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: '| Name | Site | | --- | --- | | Milifix | [Home](https://milifix.com) |',
          },
        ],
      },
    ];
    expect(renderChildren(nodes)).toBe(
      '<table><thead><tr><th>Name</th><th>Site</th></tr></thead><tbody><tr><td>Milifix</td><td><a href="https://milifix.com" target="_blank" rel="noopener noreferrer">Home</a></td></tr></tbody></table>',
    );
  });
});

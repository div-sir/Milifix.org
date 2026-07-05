import { describe, it, expect } from 'vitest';
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
    const node = { type: 'upload', children: [{ type: 'text', text: 'fallback' }] } as unknown as LexicalNode;
    expect(renderNode(node)).toBe('fallback');
  });

  it('renders an unknown, childless node type as empty string without throwing', () => {
    const node = { type: 'linebreak' } as unknown as LexicalNode;
    expect(() => renderNode(node)).not.toThrow();
    expect(renderNode(node)).toBe('');
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
});

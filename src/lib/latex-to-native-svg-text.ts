// Parse simple LaTeX and render as native SVG text/line/path elements
// Supports: \frac, \dfrac, \overline, \bar, \text, \sqrt

const NS = 'http://www.w3.org/2000/svg';
const FONT_STYLE = "font-family: 'Times New Roman', Times, serif; font-style: italic; font-size: 14px;";
const CHAR_WIDTH = 7; // approximate px per character at 14px

type LatexToken =
  | { type: 'text'; value: string }
  | { type: 'frac'; num: string; den: string }
  | { type: 'overline'; value: string }
  | { type: 'bar'; value: string }
  | { type: 'sqrt'; value: string };

/** Extract brace-delimited content: {content} starting at position `start` */
function braceContent(s: string, start: number): [string, number] {
  if (s[start] !== '{') return ['', start];
  let depth = 1, j = start + 1;
  while (j < s.length && depth > 0) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}') depth--;
    j++;
  }
  return [s.slice(start + 1, j - 1), j];
}

/** Parse LaTeX string into renderable tokens */
export function parseLatex(input: string): LatexToken[] {
  const tokens: LatexToken[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    if (s[i] === '\\') {
      const rest = s.slice(i);
      if (rest.startsWith('\\dfrac') || rest.startsWith('\\frac')) {
        const cmdLen = rest.startsWith('\\dfrac') ? 6 : 5;
        const [num, afterNum] = braceContent(s, i + cmdLen);
        const [den, afterDen] = braceContent(s, afterNum);
        tokens.push({ type: 'frac', num, den });
        i = afterDen;
      } else if (rest.startsWith('\\overline')) {
        const [val, after] = braceContent(s, i + 9);
        tokens.push({ type: 'overline', value: val });
        i = after;
      } else if (rest.startsWith('\\bar')) {
        const [val, after] = braceContent(s, i + 4);
        tokens.push({ type: 'bar', value: val });
        i = after;
      } else if (rest.startsWith('\\text')) {
        const [val, after] = braceContent(s, i + 5);
        tokens.push({ type: 'text', value: val });
        i = after;
      } else if (rest.startsWith('\\sqrt')) {
        const [val, after] = braceContent(s, i + 5);
        tokens.push({ type: 'sqrt', value: val });
        i = after;
      } else {
        let j = i + 1;
        while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
        tokens.push({ type: 'text', value: s.slice(i, j) });
        i = j;
      }
    } else if (s[i] === '{' || s[i] === '}') {
      i++;
    } else if (s[i] === '_' || s[i] === '^') {
      i++;
      if (i < s.length && s[i] === '{') {
        const [val, after] = braceContent(s, i);
        tokens.push({ type: 'text', value: val });
        i = after;
      } else if (i < s.length) {
        tokens.push({ type: 'text', value: s[i] });
        i++;
      }
    } else {
      let j = i;
      while (j < s.length && !'\\{}_^'.includes(s[j])) j++;
      tokens.push({ type: 'text', value: s.slice(i, j) });
      i = j;
    }
  }
  return tokens;
}

/** Estimate rendered width of a token */
function tokenWidth(tok: LatexToken): number {
  if (tok.type === 'frac') return Math.max(tok.num.length, tok.den.length) * CHAR_WIDTH + 4;
  if (tok.type === 'overline' || tok.type === 'bar') return tok.value.length * CHAR_WIDTH + 2;
  if (tok.type === 'sqrt') return tok.value.length * CHAR_WIDTH + 10;
  return tok.value.length * CHAR_WIDTH;
}

function makeText(doc: Document, x: number, y: number, content: string, extra?: Record<string, string>): SVGTextElement {
  const t = doc.createElementNS(NS, 'text') as SVGTextElement;
  t.setAttribute('x', String(x));
  t.setAttribute('y', String(y));
  t.setAttribute('dominant-baseline', 'central');
  t.setAttribute('style', FONT_STYLE);
  if (extra) for (const [k, v] of Object.entries(extra)) t.setAttribute(k, v);
  t.textContent = content;
  return t;
}

/** Map label position to SVG text-anchor */
function getTextAnchor(labelPosition: string): string {
  if (labelPosition === 'right') return 'start';
  if (labelPosition === 'left') return 'end';
  return 'middle';
}

/** Render multiline \text{ABC\\D} as stacked SVG text lines */
function createMultilineSvgLabel(
  doc: Document, lines: string[], cx: number, cy: number, labelPosition: string
): SVGElement {
  const anchor = getTextAnchor(labelPosition);
  const lineHeight = 18;
  const totalHeight = lines.length * lineHeight;
  const startY = cy - totalHeight / 2 + lineHeight / 2;
  const maxWidth = Math.max(...lines.map(l => l.length * CHAR_WIDTH));

  const g = doc.createElementNS(NS, 'g');

  if (labelPosition === 'center') {
    const bg = doc.createElementNS(NS, 'rect');
    bg.setAttribute('x', String(cx - maxWidth / 2 - 4));
    bg.setAttribute('y', String(cy - totalHeight / 2 - 3));
    bg.setAttribute('width', String(maxWidth + 8));
    bg.setAttribute('height', String(totalHeight + 6));
    bg.setAttribute('fill', 'white');
    g.appendChild(bg);
  }

  for (let i = 0; i < lines.length; i++) {
    // \text{} content renders upright (not italic)
    const style = "font-family: 'Times New Roman', Times, serif; font-size: 14px;";
    const t = doc.createElementNS(NS, 'text') as SVGTextElement;
    t.setAttribute('x', String(cx));
    t.setAttribute('y', String(startY + i * lineHeight));
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('text-anchor', anchor);
    t.setAttribute('style', style);
    t.textContent = lines[i];
    g.appendChild(t);
  }

  return g;
}

/** Build native SVG element(s) from LaTeX at anchor position (cx, cy) */
export function createSvgLabelElement(
  doc: Document, latex: string, cx: number, cy: number, labelPosition: string
): SVGElement {
  // Handle multiline \text{ABC\\D} → stacked lines (matching KaTeX canvas render)
  const textMatch = latex.match(/^\\text\s*\{(.+)\}$/);
  if (textMatch && textMatch[1].includes('\\\\')) {
    const lines = textMatch[1].split('\\\\').map(l => l.trim());
    return createMultilineSvgLabel(doc, lines, cx, cy, labelPosition);
  }

  const tokens = parseLatex(latex);
  const anchor = getTextAnchor(labelPosition);

  // Simple single text or bar: return a <text> with proper anchor
  if (tokens.length === 1) {
    const tok = tokens[0];
    let content = '';
    if (tok.type === 'text') content = tok.value;
    else if (tok.type === 'bar') content = tok.value + '\u0304';

    if (content) {
      const t = makeText(doc, cx, cy, content, { 'text-anchor': anchor });
      if (labelPosition === 'center') {
        t.setAttribute('paint-order', 'stroke');
        t.setAttribute('stroke', 'white');
        t.setAttribute('stroke-width', '4');
        t.setAttribute('fill', 'black');
      }
      return t;
    }
  }

  // Complex expression: group multiple elements
  const g = doc.createElementNS(NS, 'g');
  const totalW = tokens.reduce((sum, tok) => sum + tokenWidth(tok), 0);
  const startX = anchor === 'end' ? cx - totalW
               : anchor === 'start' ? cx
               : cx - totalW / 2;
  let xOff = 0;

  for (const tok of tokens) {
    const x = startX + xOff;
    if (tok.type === 'text') {
      g.appendChild(makeText(doc, x, cy, tok.value));
      xOff += tok.value.length * CHAR_WIDTH;
    } else if (tok.type === 'frac') {
      const fw = Math.max(tok.num.length, tok.den.length) * CHAR_WIDTH;
      const fcx = x + fw / 2;
      g.appendChild(makeText(doc, fcx, cy - 8, tok.num, { 'text-anchor': 'middle', 'dominant-baseline': 'auto' }));
      const line = doc.createElementNS(NS, 'line');
      line.setAttribute('x1', String(fcx - fw / 2 - 1));
      line.setAttribute('x2', String(fcx + fw / 2 + 1));
      line.setAttribute('y1', String(cy - 2));
      line.setAttribute('y2', String(cy - 2));
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', '0.8');
      g.appendChild(line);
      g.appendChild(makeText(doc, fcx, cy + 4, tok.den, { 'text-anchor': 'middle', 'dominant-baseline': 'hanging' }));
      xOff += fw + 4;
    } else if (tok.type === 'overline') {
      const t = makeText(doc, x, cy, tok.value);
      g.appendChild(t);
      const w = tok.value.length * CHAR_WIDTH;
      const ol = doc.createElementNS(NS, 'line');
      ol.setAttribute('x1', String(x - 1));
      ol.setAttribute('x2', String(x + w + 1));
      ol.setAttribute('y1', String(cy - 7));
      ol.setAttribute('y2', String(cy - 7));
      ol.setAttribute('stroke', 'black');
      ol.setAttribute('stroke-width', '1');
      g.appendChild(ol);
      xOff += w + 2;
    } else if (tok.type === 'bar') {
      g.appendChild(makeText(doc, x, cy, tok.value + '\u0304'));
      xOff += tok.value.length * CHAR_WIDTH + 2;
    } else if (tok.type === 'sqrt') {
      const w = tok.value.length * CHAR_WIDTH;
      const path = doc.createElementNS(NS, 'path');
      path.setAttribute('d', `M${x},${cy + 2} L${x + 3},${cy + 6} L${x + 6},${cy - 10} L${x + 8 + w},${cy - 10}`);
      path.setAttribute('stroke', 'black');
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('fill', 'none');
      g.appendChild(path);
      g.appendChild(makeText(doc, x + 8, cy, tok.value));
      xOff += w + 10;
    }
  }

  if (labelPosition === 'center') {
    const bg = doc.createElementNS(NS, 'rect');
    bg.setAttribute('x', String(startX - 3));
    bg.setAttribute('y', String(cy - 12));
    bg.setAttribute('width', String(totalW + 6));
    bg.setAttribute('height', '24');
    bg.setAttribute('fill', 'white');
    g.insertBefore(bg, g.firstChild);
  }
  return g;
}

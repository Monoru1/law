import {
  choiceFact,
  dominantUnsignedPrinciple,
  lawOriginFact,
  lawStatement,
} from './laws';
import type { Content, GameState } from './types';
export function applyFrenchTypography(text: string): string {
  return text
    .replace(/\s*([;:!?])/g, '\u202F$1')
    .replace(/«\s*/g, '«\u202F')
    .replace(/\s*»/g, '\u202F»')
    .replace(/\b'/g, '’');
}
export function escapePlayerText(text: string): string {
  return text.slice(0, 280).replace(/[\u0000-\u001F\u007F]/g, '');
}
export function renderText(
  template: string,
  state: GameState,
  content: Content,
  lawNumber?: number,
): string {
  const output = template
    .split(/(\{\{[^{}]+\}\})/g)
    .map((part) => {
      if (!part.startsWith('{{')) return applyFrenchTypography(part);
      const raw = part.slice(2, -2);
      const [key, fallback] = raw.split('|');
      if (fallback === undefined) return '';
      const [source, ...rest] = (key ?? '').split(':');
      const name = rest.join(':');
      if (source === 'derived' && name === 'statement') {
        const principle = dominantUnsignedPrinciple(state, content);
        return principle?.statements[0]?.text ?? fallback;
      }
      if (source === 'var') return String(state.vars[name] ?? fallback);
      // The exact words of the latest note carrying that tag.
      if (source === 'note') {
        const note = state.notes.findLast((n) => n.tags.includes(name));
        return note?.text ? escapePlayerText(note.text) : fallback;
      }
      // What the player wrote at one point of a conversation: scene.node.
      if (source === 'said') {
        const [sceneId, nodeId] = name.split('/');
        const line = state.lines.findLast(
          (l) => l.sceneId === sceneId && l.nodeId === nodeId && l.text,
        );
        return line?.text ? escapePlayerText(line.text) : fallback;
      }
      if (source === 'value') return String(state.choices[name] ?? fallback);
      if (source === 'text')
        return name in state.justifications
          ? escapePlayerText(state.justifications[name] ?? '')
          : fallback;
      if (source === 'count' && name === 'decisions')
        return String(state.decisions);
      if (source === 'confrontation' && name === 'fact') {
        const pending = state.pendingConfrontations[0];
        const fact = pending
          ? choiceFact(pending.sceneId, state, content)
          : null;
        return fact ? renderText(fact, state, content, lawNumber) : fallback;
      }
      const [reference, field] = (rest[0] ?? '').split('.');
      const lawReference = source === 'since' ? rest[1] : reference;
      const n = Number(lawReference === 'N' ? lawNumber : lawReference);
      const law = state.laws.find((l) => l.number === n);
      if (source === 'law' && law && field === 'origin') {
        const fact = lawOriginFact(law, state, content);
        return fact ? renderText(fact, state, content, lawNumber) : fallback;
      }
      if (source === 'law' && law)
        return field === 'number'
          ? String(law.number).padStart(2, '0')
          : field === 'statement'
            ? lawStatement(law, content)
            : fallback;
      if (source === 'since' && rest[0] === 'law' && law)
        return String(state.decisions - law.signedAtDecision);
      return fallback;
    })
    .join('');
  return output;
}

// Simulation validation: checking the whole beat misses empty embedded quotes.
// Player text may itself contain braces; it is inserted, never interpreted, so
// only the authored template is checked for malformed tokens.
export function assertRenderedText(
  template: string,
  state: GameState,
  content: Content,
  lawNumber?: number,
): void {
  for (const token of template.match(/\{\{[^{}]+\}\}/g) ?? []) {
    const resolved = renderText(token, state, content, lawNumber);
    if (!resolved.trim()) throw new Error(`Empty template ${token}`);
  }
  if (/\{\{|\}\}/.test(template.replace(/\{\{[^{}]+\}\}/g, '')))
    throw new Error(`Unresolved template ${template}`);
}

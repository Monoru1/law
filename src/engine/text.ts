import { dominantUnsignedPrinciple } from './laws';
import { lawStatement } from './laws';
import type { Content, GameState } from './types';
export function applyFrenchTypography(text: string): string { return text.replace(/\s*([;:!?])/g, '\u202F$1').replace(/«\s*/g, '«\u202F').replace(/\s*»/g, '\u202F»').replace(/\b'/g, '’'); }
export function escapePlayerText(text: string): string { return text.slice(0,280).replace(/[\u0000-\u001F\u007F]/g, ''); }
export function renderText(template: string, state: GameState, content: Content, lawNumber?: number): string {
  const output = template.split(/(\{\{[^{}]+\}\})/g).map(part => {
    if (!part.startsWith('{{')) return applyFrenchTypography(part);
    const raw = part.slice(2,-2);
    const [key, fallback] = raw.split('|'); if (fallback === undefined) return '';
    const [source, ...rest] = (key ?? '').split(':'); const name = rest.join(':');
    if (source === 'derived' && name === 'statement') { const principle = dominantUnsignedPrinciple(state, content); return principle?.statements[0]?.text ?? fallback; }
    if (source === 'var') return String(state.vars[name] ?? fallback);
    if (source === 'value') return String(state.choices[name] ?? fallback);
    if (source === 'text') return name in state.justifications ? escapePlayerText(state.justifications[name] ?? '') : fallback;
    if (source === 'count' && name === 'decisions') return String(state.decisions);
    const n = Number(rest[0] === 'N' ? lawNumber : rest[0]); const law = state.laws.find(l => l.number === n);
    if (source === 'law' && law) return rest[1] === 'number' ? String(law.number).padStart(2,'0') : rest[1] === 'statement' ? lawStatement(law, content) : fallback;
    if (source === 'since' && rest[0] === 'law' && law) return String(state.decisions - law.signedAtDecision);
    return fallback;
  }).join('');
  return output;
}

import {
  evaluate,
  renderText,
  talkNode,
  talkOf,
  type Content,
  type GameState,
  type Scene,
  type TalkLine,
} from '../../engine';

// What the conversation looks like right now, read from the journal alone: a
// reload returns to exactly this. Pure, so the reading order is testable.
export type Segment =
  | {
      kind: 'line';
      key: string;
      who: string;
      text: string;
      style?: TalkLine['style'];
      pauseMs?: number;
      // The first line of a run by one speaker carries the speaker's name.
      opens: boolean;
    }
  | {
      kind: 'reply';
      key: string;
      text: string;
      silent: boolean;
      // Silence lingers before LAW answers it.
      mode: 'reply' | 'silence' | 'written' | 'declined';
    };

export function talkSegments(
  scene: Scene,
  state: GameState,
  content: Content,
): Segment[] {
  const talk = talkOf(scene);
  const track = state.talk[scene.id];
  if (!talk || !track) return [];
  const out: Segment[] = [];
  let previous: string | null = null;
  track.trail.forEach((item, index) => {
    const node = talkNode(talk, item.nodeId);
    if (!node) return;
    node.lines?.forEach((line, i) => {
      if (line.requires && !evaluate(line.requires, state)) return;
      out.push({
        kind: 'line',
        key: `${index}:${i}`,
        who: line.who,
        text: renderText(line.text, state, content),
        style: line.style,
        pauseMs: line.pauseMs,
        opens: line.who !== previous,
      });
      previous = line.who;
    });
    const reply = item.reply;
    if (!reply || reply.mode === 'timeout') {
      // A question that ran out has no echo: the silence is LAW's to answer.
      if (reply?.mode === 'timeout') previous = null;
      return;
    }
    const label =
      reply.mode === 'written'
        ? (reply.text ?? '')
        : reply.mode === 'declined'
          ? (node.write?.declineLabel ?? '…')
          : (node.ask?.replies.find((r) => r.id === reply.optionId)?.label ??
            '…');
    out.push({
      kind: 'reply',
      key: `${index}:r`,
      text: label,
      silent: reply.mode === 'silence' || reply.mode === 'declined',
      mode: reply.mode as 'reply' | 'silence' | 'written' | 'declined',
    });
    previous = null;
  });
  return out;
}

export type Env = 'rue' | 'salle' | 'couloir' | 'noir' | 'maison';
export const envOf = (ambience: string | undefined): Env =>
  ambience === 'rain'
    ? 'rue'
    : ambience === 'home'
      ? 'maison'
      : ambience === 'corridor'
      ? 'couloir'
      : ambience === 'silence'
        ? 'noir'
        : 'salle';

export const SPEAKERS: Record<string, string> = {
  law: 'LAW',
  femme: 'La femme',
  elias: 'Elias',
  nora: 'Nora',
  copie: 'Toi',
  jade: 'Jade',
  lou: 'Lou',
};

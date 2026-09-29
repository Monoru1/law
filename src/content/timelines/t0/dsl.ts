import type {
  Condition,
  Effect,
  NoteKind,
  NoteStatus,
  Scene,
  TalkLine,
  TalkNode,
  TalkReply,
  TalkSpec,
} from '../../../engine';

type Opts = Partial<Omit<TalkLine, 'who' | 'text'>>;
const by =
  (who: string) =>
  (text: string, opts: Opts = {}): TalkLine => ({ who, text, ...opts });

// Speakers. LAW never has a stage direction; the narrator never speaks aloud.
export const law = by('law');
export const stage = by('narrator');
export const femme = by('femme');
export const copie = by('copie');
export const jade = by('jade');
export const elias = by('elias');
export const nora = by('nora');
export const lou = by('lou');
// Big numerals on black: a year passing. And a message on a screen.
export const year = by('year');
export const notif = by('notif');

// A pause worth keeping: the conversation holds its breath.
export const held = (ms = 2200): Opts => ({ pauseMs: ms });

export const reply = (
  id: string,
  label: string,
  rest: Omit<TalkReply, 'id' | 'label'> = {},
): TalkReply => ({ id, label, ...rest });

// An explicit choice to say nothing, recorded apart from a timeout.
export const silence = (
  id = 'silence',
  label = '…',
  rest: Omit<TalkReply, 'id' | 'label' | 'silent'> = {},
): TalkReply => ({ id, label, silent: true, ...rest });

export const said = (
  sceneId: string,
  nodeId: string,
  optionId?: string,
): Condition => ({
  said: { sceneId, nodeId, ...(optionId ? { optionId } : {}) },
});

// What LAW writes down, as an effect.
export const note = (
  kind: NoteKind,
  tag: string | string[],
  status: NoteStatus = 'fact',
  extra: { fromText?: boolean; text?: string } = {},
): Effect => ({
  note: {
    kind,
    status,
    tags: Array.isArray(tag) ? tag : [tag],
    ...extra,
  },
});

export const flag = (name: string): Effect => ({ setFlag: name });
export const has = (name: string): Condition => ({ flag: name });
export const not = (condition: Condition): Condition => ({ not: condition });
export const all = (...conditions: Condition[]): Condition => ({
  all: conditions,
});
export const any = (...conditions: Condition[]): Condition => ({
  any: conditions,
});

// Nodes.
export const N = (
  id: string,
  lines: TalkLine[],
  rest: Omit<TalkNode, 'id' | 'lines'> = {},
): TalkNode => ({ id, lines, ...rest });

export const A = (
  id: string,
  replies: TalkReply[],
  ask: { timeoutMs?: number; onTimeout?: string } = {},
): TalkNode => ({ id, ask: { replies, ...ask } });

export const W = (
  id: string,
  prompt: string,
  placeholder: string,
  write: Partial<NonNullable<TalkNode['write']>> = {},
): TalkNode => ({
  id,
  write: { prompt, placeholder, maxLength: 200, ...write },
});

export const E = (id = 'end', outcome = 'suite'): TalkNode => ({
  id,
  end: outcome,
});

type SceneOptions = {
  id: string;
  title: string;
  ambience?: 'room' | 'rain' | 'corridor' | 'silence' | 'home';
  flags?: string[];
  regression?: 0 | 1 | 2 | 3;
  start: string;
  nodes: TalkNode[];
  clock?: TalkSpec['clock'];
  // Default: one outcome, 'suite', with nothing to show.
  outcomes?: Scene['outcomes'];
};

export const talkScene = (o: SceneOptions): Scene => ({
  id: `t0.${o.id}`,
  version: 1,
  timelineId: 't0',
  title: o.title,
  regression: o.regression ?? 0,
  contentFlags: o.flags ?? [],
  audio: { ambience: o.ambience ?? 'room' },
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: o.start,
      nodes: o.nodes,
      ...(o.clock ? { clock: o.clock } : {}),
    },
  },
  outcomes: o.outcomes ?? [{ when: { optionId: 'suite' }, beats: [] }],
});

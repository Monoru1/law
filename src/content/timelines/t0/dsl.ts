import type { Condition, TalkLine, TalkReply } from '../../../engine';

type Opts = Partial<Omit<TalkLine, 'who' | 'text'>>;
const by =
  (who: string) =>
  (text: string, opts: Opts = {}): TalkLine => ({ who, text, ...opts });

// Speakers. LAW never has a stage direction; the narrator never speaks aloud.
export const law = by('law');
export const stage = by('narrator');
export const femme = by('femme');

// A pause worth keeping: the conversation holds its breath.
export const held = (ms = 2200): Opts => ({ pauseMs: ms });

export const reply = (
  id: string,
  label: string,
  rest: Omit<TalkReply, 'id' | 'label'> = {},
): TalkReply => ({ id, label, ...rest });

// An explicit choice to say nothing, recorded apart from a timeout.
export const silence = (id = 'silence', label = '…'): TalkReply => ({
  id,
  label,
  silent: true,
});

export const said = (
  sceneId: string,
  nodeId: string,
  optionId?: string,
): Condition => ({
  said: { sceneId, nodeId, ...(optionId ? { optionId } : {}) },
});

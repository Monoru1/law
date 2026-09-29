import { describe, expect, it } from 'vitest';
import { contentT0 } from '../../src/content/t0';
import {
  auditContent,
  auditTalk,
  evaluate,
  initialState,
  reduce,
  renderText,
  replay,
  validateEvent,
  visibleReplies,
  type Content,
  type GameEvent,
  type Scene,
} from '../../src/engine';
import { seeded } from '../../scripts/simulation';
import { simulateTalkRun } from '../../scripts/simulation-talk';

let serial = 0;
const ev = (draft: Record<string, unknown>) =>
  ({ ...draft, id: `t${++serial}`, at: serial }) as GameEvent;

// A conversation small enough to read whole.
const scene: Scene = {
  id: 't0.essai',
  version: 1,
  timelineId: 't0',
  title: 'Essai',
  regression: 0,
  contentFlags: [],
  beats: [],
  input: {
    kind: 'talk',
    talk: {
      start: 'a',
      nodes: [
        { id: 'a', lines: [{ who: 'law', text: 'Pourquoi ?' }] },
        {
          id: 'ask',
          ask: {
            timeoutMs: 1000,
            onTimeout: 'tard',
            replies: [
              {
                id: 'dire',
                label: 'Parce que.',
                next: 'ecrit',
                effects: [{ setFlag: 'a-repondu' }],
              },
              {
                id: 'q',
                label: 'Pourquoi ?',
                once: true,
                next: 'ask',
              },
              { id: 'rien', label: '…', silent: true, next: 'fin' },
            ],
          },
        },
        {
          id: 'ecrit',
          write: {
            prompt: 'Écris',
            placeholder: '',
            maxLength: 20,
            next: 'fin',
            declineNext: 'fin',
            effects: [
              {
                note: {
                  kind: 'justification',
                  tags: ['pourquoi'],
                  fromText: true,
                },
              },
            ],
          },
        },
        { id: 'tard', next: 'fin' },
        { id: 'fin', end: 'fini' },
      ],
    },
  },
  outcomes: [{ when: { optionId: 'fini' }, beats: [] }],
};
const content: Content = {
  ...contentT0,
  scenes: [scene],
  order: [scene.id],
  flow: { ...contentT0.flow, codaSceneId: scene.id },
};

function start() {
  let state = reduce(
    initialState(),
    ev({ type: 'run_started', contentVersion: '0' }),
    content,
  );
  state = reduce(
    state,
    ev({ type: 'scene_entered', sceneId: scene.id, sceneVersion: 1 }),
    content,
  );
  return state;
}
const line = (nodeId: string, optionId: string, mode: string, text?: string) =>
  ev({
    type: 'line_chosen',
    sceneId: scene.id,
    sceneVersion: 1,
    nodeId,
    optionId,
    mode,
    hesitationMs: 10,
    ...(text ? { text } : {}),
  });

describe('conversation engine', () => {
  it('walks lines that need no answer up to the first question', () => {
    const state = start();
    expect(state.talk[scene.id]).toMatchObject({ cursor: 'ask', end: null });
    expect(state.talk[scene.id]!.trail.map((t) => t.nodeId)).toEqual([
      'a',
      'ask',
    ]);
  });

  it('records a reply, applies its effects and moves on', () => {
    let state = start();
    const e = line('ask', 'dire', 'reply');
    validateEvent(e, state, content);
    state = reduce(state, e, content);
    expect(state.flags).toContain('a-repondu');
    expect(state.talk[scene.id]!.cursor).toBe('ecrit');
    expect(state.talk[scene.id]!.trail[1]!.reply?.optionId).toBe('dire');
  });

  it('keeps exact words as a note and quotes them back', () => {
    let state = start();
    state = reduce(state, line('ask', 'dire', 'reply'), content);
    const written = line('ecrit', 'written', 'written', 'à cet instant');
    validateEvent(written, state, content);
    state = reduce(state, written, content);
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0]).toMatchObject({
      kind: 'justification',
      status: 'fact',
      stance: 'open',
      text: 'à cet instant',
    });
    expect(renderText('« {{note:pourquoi|x}} »', state, content)).toContain(
      'à cet instant',
    );
    expect(
      evaluate({ noted: { tag: 'pourquoi', status: 'fact' } }, state),
    ).toBe(true);
    expect(
      evaluate({ noted: { tag: 'pourquoi', status: 'inference' } }, state),
    ).toBe(false);
  });

  it('separates a timeout from an explicit silence', () => {
    const state = start();
    const timeout = line('ask', 'timeout', 'timeout');
    validateEvent(timeout, state, content);
    const late = reduce(state, timeout, content);
    expect(late.lines[0]).toMatchObject({ mode: 'timeout' });
    expect(late.talk[scene.id]!.end).toBe('fini');
    const quiet = reduce(state, line('ask', 'rien', 'silence'), content);
    expect(quiet.lines[0]).toMatchObject({ mode: 'silence' });
    expect(
      evaluate(
        { said: { sceneId: scene.id, nodeId: 'ask', mode: 'timeout' } },
        late,
      ),
    ).toBe(true);
    expect(
      evaluate(
        { said: { sceneId: scene.id, nodeId: 'ask', mode: 'timeout' } },
        quiet,
      ),
    ).toBe(false);
  });

  it('refuses events the conversation cannot have produced', () => {
    const state = start();
    const refused = (e: GameEvent, s = state) =>
      expect(() => validateEvent(e, s, content)).toThrow();
    refused(line('ecrit', 'written', 'written', 'x')); // not the awaited node
    refused(line('ask', 'inconnu', 'reply'));
    refused(line('ask', 'rien', 'reply')); // a silence cannot pose as a reply
    refused(line('ask', 'dire', 'silence'));
    refused(line('ask', 'dire', 'reply', 'texte libre interdit'));
    refused(line('ask', 'timeout', 'written'));
    const asking = reduce(state, line('ask', 'dire', 'reply'), content);
    refused(line('ecrit', 'written', 'written', ''), asking);
    refused(line('ecrit', 'written', 'written', ' padded '), asking);
    refused(line('ecrit', 'written', 'written', 'x'.repeat(21)), asking);
    refused(line('ecrit', 'declined', 'declined', 'oops'), asking);
    // The conversation cannot be locked before it has ended.
    refused(
      ev({
        type: 'choice_locked',
        sceneId: scene.id,
        sceneVersion: 1,
        input: 'talk',
        value: 'fini',
        hesitationMs: 0,
        selectionChanges: 0,
      }),
    );
  });

  it('hides a one-time question once it has been asked', () => {
    let state = start();
    const node = (s: typeof state) =>
      visibleReplies(
        s,
        scene,
        scene.input.kind === 'talk'
          ? scene.input.talk.nodes[1]!
          : (undefined as never),
      ).map((r) => r.id);
    expect(node(state)).toContain('q');
    state = reduce(state, line('ask', 'q', 'reply'), content);
    expect(state.talk[scene.id]!.cursor).toBe('ask');
    expect(node(state)).not.toContain('q');
    expect(() =>
      validateEvent(line('ask', 'q', 'reply'), state, content),
    ).toThrow();
  });

  it('replays to exactly the same state', () => {
    let state = start();
    const events = [
      line('ask', 'q', 'reply'),
      line('ask', 'dire', 'reply'),
      line('ecrit', 'written', 'written', 'oui'),
    ];
    for (const e of events) state = reduce(state, e, content);
    const again = replay(state.events, content);
    expect(again).toEqual(state);
  });

  it('lets an inference be contested and keeps the stance', () => {
    const inference = {
      ...scene,
      input: {
        kind: 'talk' as const,
        talk: {
          start: 'n',
          nodes: [
            {
              id: 'n',
              effects: [
                {
                  note: {
                    kind: 'interpretation' as const,
                    status: 'inference' as const,
                    tags: ['lecture'],
                    text: 'Tu sembles décider vite.',
                  },
                },
              ],
            },
            {
              id: 'ask',
              ask: {
                replies: [
                  {
                    id: 'non',
                    label: 'Tu n’en sais rien.',
                    next: 'fin',
                    effects: [
                      {
                        stance: { tag: 'lecture', stance: 'refused' as const },
                      },
                    ],
                  },
                ],
              },
            },
            { id: 'fin', end: 'fini' },
          ],
        },
      },
    };
    const local: Content = { ...content, scenes: [inference] };
    let state = reduce(
      initialState(),
      ev({ type: 'run_started', contentVersion: '0' }),
      local,
    );
    state = reduce(
      state,
      ev({ type: 'scene_entered', sceneId: scene.id, sceneVersion: 1 }),
      local,
    );
    expect(evaluate({ noted: { tag: 'lecture', stance: 'open' } }, state)).toBe(
      true,
    );
    state = reduce(state, line('ask', 'non', 'reply'), local);
    expect(state.notes[0]).toMatchObject({
      status: 'inference',
      stance: 'refused',
    });
    expect(
      evaluate({ noted: { tag: 'lecture', stance: 'refused' } }, state),
    ).toBe(true);
  });
});

describe('narrative audit', () => {
  it('finds no problem in Timeline 0', () => {
    expect(auditContent(contentT0)).toEqual([]);
  });

  it('catches a dead end, an unreachable node, a missing outcome and an unread callback', () => {
    const broken: Scene = {
      ...scene,
      input: {
        kind: 'talk',
        talk: {
          start: 'a',
          nodes: [
            { id: 'a', ask: { replies: [{ id: 'x', label: 'x', next: 'b' }] } },
            { id: 'b', next: 'nowhere' },
            { id: 'orphan', end: 'fini' },
            { id: 'stop', end: 'absent' },
          ],
        },
      },
    };
    const problems = auditTalk(broken);
    expect(problems.join('\n')).toMatch(/unknown node nowhere/);
    expect(problems.join('\n')).toMatch(/orphan is unreachable/);
    expect(problems.join('\n')).toMatch(/end absent has no outcome/);
    expect(problems.join('\n')).toMatch(/cannot reach an end/);
    const reader: Scene = {
      ...scene,
      id: 't0.lecteur',
      when: { all: [{ flag: 'jamais' }, { noted: { tag: 'rien' } }] },
    };
    const found = auditContent({ ...content, scenes: [scene, reader] });
    expect(found.join('\n')).toMatch(/flag jamais is read but never set/);
    expect(found.join('\n')).toMatch(/note rien is read but never written/);
  });
});

describe('Timeline 0 played by a seeded player', () => {
  it('continues from the trip into the twenty years', () => {
    expect(contentT0.order.slice(-2)).toEqual([
      't0.le-trajet',
      't0.les-vingt-annees',
    ]);
    expect(
      contentT0.scenes.find((scene) => scene.id === 't0.les-vingt-annees'),
    ).toBeDefined();
  });

  it('always completes, and every journal validates', () => {
    const clock = { at: 0 };
    const nodes = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const run = simulateTalkRun(contentT0, seeded(seed), clock, {
        timeoutRate: seed % 5 === 0 ? 0.6 : 0.1,
        silenceRate: seed % 3 === 0 ? 0.8 : 0.1,
        seen: nodes,
        skipRate: seed % 7 === 0 ? 0.3 : 0,
      });
      expect(run.state.completed).toBe(true);
      expect(replay(run.events, contentT0)).toEqual(run.state);
      run.nodes.forEach((n) => nodes.add(n));
    }
    // Every node of every conversation is reached by someone.
    for (const scene of contentT0.scenes) {
      if (scene.input.kind !== 'talk') continue;
      for (const node of scene.input.talk.nodes)
        expect(nodes, `${scene.id}/${node.id}`).toContain(
          `${scene.id}/${node.id}`,
        );
    }
  }, 300000);
});

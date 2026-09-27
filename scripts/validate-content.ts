import { content, copy } from '../src/content';
import {
  sceneSchema,
  principleSchema,
  observationSchema,
} from '../src/engine/schema';
import {
  nextScene,
  reduce,
  initialState,
  resolveScene,
  renderText,
  assertRenderedText,
  validateEvent,
  resolvedBeats,
  type Condition,
  type GameEvent,
  type GameState,
} from '../src/engine';
const fail = (message: string): never => {
  throw new Error(message);
};
const sceneIds = new Set<string>();
const principleIds = new Set(content.principles.map((p) => p.id));
const statements = new Set(
  content.principles.flatMap((p) => p.statements.map((s) => s.id)),
);
for (const scene of content.scenes) {
  sceneSchema.parse(scene);
  if (sceneIds.has(scene.id)) fail(`Duplicate scene ${scene.id}`);
  sceneIds.add(scene.id);
}
for (const principle of content.principles) principleSchema.parse(principle);
for (const observation of content.observations)
  observationSchema.parse(observation);
const checkCondition = (c: Condition): void => {
  if ('all' in c) c.all.forEach(checkCondition);
  else if ('any' in c) c.any.forEach(checkCondition);
  else if ('not' in c) checkCondition(c.not);
  else if ('chose' in c) {
    if (!sceneIds.has(c.chose.sceneId))
      fail(`Unknown scene ${c.chose.sceneId}`);
    const scene = content.scenes.find((s) => s.id === c.chose.sceneId);
    if (
      scene &&
      (scene.input.kind === 'binary' ||
        scene.input.kind === 'choice' ||
        scene.input.kind === 'glyph') &&
      !scene.input.options.some((o) => o.id === c.chose.optionId)
    )
      fail(`Unknown option ${c.chose.optionId}`);
  } else if (
    'value' in c &&
    !('var' in c) &&
    typeof c.value === 'object' &&
    !sceneIds.has(c.value.sceneId)
  )
    fail(`Unknown scene ${c.value.sceneId}`);
  else if ('visited' in c && !sceneIds.has(c.visited))
    fail(`Unknown scene ${c.visited}`);
  else if ('answered' in c && !sceneIds.has(c.answered))
    fail(`Unknown scene ${c.answered}`);
  else if ('law' in c && !principleIds.has(c.law.principleId))
    fail(`Unknown principle ${c.law.principleId}`);
};
const templates = (text: string) => {
  if (/\{\{[^{}]+\}\}/.test(text))
    for (const token of text.match(/\{\{[^{}]+\}\}/g) ?? [])
      if (
        !token.includes('|') &&
        token !== '{{n}}' &&
        token !== '{{scène}}' &&
        token !== '{{secondes}}'
      )
        fail(`Template has no fallback: ${token}`);
  if (/"/.test(text)) fail(`Straight quote: ${text}`);
};
for (const scene of content.scenes) {
  if (scene.when) checkCondition(scene.when);
  for (const v of scene.variants ?? []) {
    checkCondition(v.when);
    for (const b of v.beats ?? []) {
      templates(b.text);
      if (b.requires) checkCondition(b.requires);
    }
  }
  for (const b of scene.beats) {
    templates(b.text);
    if (b.requires) checkCondition(b.requires);
  }
  for (const o of scene.outcomes) {
    if (
      'optionId' in o.when &&
      (scene.input.kind === 'binary' ||
        scene.input.kind === 'choice' ||
        scene.input.kind === 'glyph') &&
      !scene.input.options.some(
        (opt) => opt.id === ('optionId' in o.when ? o.when.optionId : ''),
      )
    )
      fail(`Invalid outcome in ${scene.id}`);
    o.beats.forEach((b) => templates(b.text));
    for (const e of o.effects ?? []) {
      if ('schedule' in e) {
        if (!content.scenes.some((s) => s.id === e.schedule.sceneId))
          fail(`Unknown schedule ${e.schedule.sceneId}`);
        if (e.schedule.when) checkCondition(e.schedule.when);
      }
      if (
        'proposeLaw' in e &&
        (!principleIds.has(e.proposeLaw.principleId) ||
          !statements.has(e.proposeLaw.statementId))
      )
        fail('Unknown proposed law');
    }
  }
  if (
    scene.input.kind === 'binary' ||
    scene.input.kind === 'choice' ||
    scene.input.kind === 'glyph'
  )
    for (const option of scene.input.options)
      for (const evidence of option.evidence ?? [])
        if (!principleIds.has(evidence.principleId))
          fail('Unknown evidence principle');
}
for (const rule of content.observations) {
  checkCondition(rule.when);
  templates(rule.text);
}
content.principles.forEach((p) =>
  p.statements.forEach((s) => templates(s.text)),
);
copy.onboarding.forEach((b) => templates(b.text));
let seed = 571;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const hits: Record<string, number> = {};
const variants: Record<string, number> = {};
const confrontationAnswers = new Set<string>();
let serial = 0;
type EventDraft = GameEvent extends infer E
  ? E extends GameEvent
    ? Omit<E, 'id' | 'at'>
    : never
  : never;
const event = (state: GameState, e: EventDraft): GameState => {
  const next = { ...e, id: String(++serial), at: serial } as GameEvent;
  validateEvent(next, state, content);
  return reduce(state, next, content);
};
for (let run = 0; run < 500; run++) {
  let state = event(initialState(), {
    type: 'run_started',
    contentVersion: content.version,
  });
  let steps = 0;
  while (steps++ < 25) {
    const raw = nextScene(state, content);
    if (!raw) break;
    hits[raw.id] = (hits[raw.id] ?? 0) + 1;
    const variant = raw.variants?.find((v) => {
      const temp = resolveScene(raw, state);
      return temp.beats === v.beats;
    });
    if (variant)
      variants[`${raw.id}:${variant.id}`] =
        (variants[`${raw.id}:${variant.id}`] ?? 0) + 1;
    const scene = resolveScene(raw, state);
    const lawNumber = state.pendingConfrontations[0]?.lawNumber ?? undefined;
    state = event(state, {
      type: 'scene_entered',
      sceneId: scene.id,
      sceneVersion: scene.version,
    });
    for (const beat of resolvedBeats(scene.beats, state)) {
      assertRenderedText(beat.text, state, content, lawNumber);
      const text = renderText(
        beat.text,
        state,
        content,
        state.pendingConfrontations[0]?.lawNumber ?? undefined,
      );
      if (text.includes('{{')) fail(`Unresolved template ${scene.id}: ${text}`);
    }
    if (scene.id === 't1.pourquoi' && rand() > 0.2)
      state = event(state, {
        type: 'justification_given',
        sceneId: scene.id,
        text: 'Parce que je le voulais.',
      });
    let confrontationAnswer = 'maintain';
    if (scene.id === 't1.confrontation') {
      const pending = state.pendingConfrontations[0];
      if (pending) {
        const answer = (['maintain', 'nuance', 'abandon', 'silence'] as const)[
          Math.floor(rand() * 4)
        ]!;
        confrontationAnswer = answer;
        confrontationAnswers.add(answer);
        if (answer === 'nuance')
          state = event(state, {
            type: 'law_revised',
            lawNumber: pending.lawNumber!,
            newStatementId:
              content.principles.find((p) => p.id === pending.principleId)
                ?.statements[1]?.id ?? null,
            customText: undefined,
          });
        else if (answer === 'abandon')
          state = event(state, {
            type: 'law_abandoned',
            lawNumber: pending.lawNumber!,
          });
        state = event(state, {
          type: 'confrontation_answered',
          lawNumber: pending.lawNumber,
          answer,
        });
      }
    }
    if (scene.id === 't1.confrontation-non-signee' && rand() > 0.5) {
      const p = [...content.principles].sort(
        (a, b) => (state.evidence[b.id] ?? 0) - (state.evidence[a.id] ?? 0),
      )[0];
      if (p?.statements[0])
        state = event(state, {
          type: 'law_signed',
          lawNumber: 1,
          principleId: p.id,
          statementId: p.statements[0].id,
        });
    }
    let value: string | number = '';
    if (scene.input.kind === 'slider') value = Math.floor(rand() * 41);
    else if (
      scene.input.kind === 'binary' ||
      scene.input.kind === 'choice' ||
      scene.input.kind === 'glyph'
    )
      value =
        scene.input.options[Math.floor(rand() * scene.input.options.length)]!
          .id;
    else if (scene.input.kind === 'freeText') value = 'written';
    else if (scene.input.kind === 'lawProposal') value = 'no';
    else value = confrontationAnswer;
    state = event(state, {
      type: 'choice_locked',
      sceneId: scene.id,
      sceneVersion: scene.version,
      input: scene.input.kind,
      value,
      hesitationMs: 1200,
      selectionChanges: 0,
    });
    const outcome = scene.outcomes.find(
      (o) =>
        'any' in o.when ||
        ('optionId' in o.when && o.when.optionId === value) ||
        ('range' in o.when &&
          typeof value === 'number' &&
          value >= o.when.range[0] &&
          value <= o.when.range[1]),
    );
    for (const beat of resolvedBeats(outcome?.beats ?? [], state)) {
      assertRenderedText(beat.text, state, content, lawNumber);
      const text = renderText(beat.text, state, content, lawNumber);
      if (text.includes('{{'))
        fail(`Unresolved consequence ${scene.id}: ${text}`);
    }
    const pending = state.pendingLaws[0];
    if (pending && scene.id === 't1.chambre-froide') {
      if (rand() > 0.3)
        state = event(state, {
          type: 'law_signed',
          lawNumber: 1,
          principleId: pending.principleId,
          statementId: pending.statementId,
        });
      else
        state = event(state, {
          type: 'law_declined',
          principleId: pending.principleId,
        });
    }
  }
  if (steps >= 25) fail(`Non-terminating run ${run}`);
  if (state.visited.at(-1) !== 't1.coda')
    fail(`Coda is not final in run ${run}`);
  if (state.pendingConfrontations.length)
    fail(`Unprocessed confrontation in run ${run}`);
  for (const contradiction of state.contradictions) {
    if (
      !state.events.some(
        (e) =>
          e.id === contradiction.choiceEventId && e.type === 'choice_locked',
      ) ||
      !state.events.some(
        (e) => e.id === contradiction.lawEventId && e.type === 'law_signed',
      )
    )
      fail(`Contradiction without historical evidence in run ${run}`);
  }
}
for (const scene of content.scenes)
  if (!hits[scene.id]) fail(`Unreachable scene ${scene.id}`);
if (confrontationAnswers.size !== 4)
  fail('Some confrontation answers were not simulated');
for (const scene of content.scenes)
  for (const variant of scene.variants ?? [])
    if (!variants[`${scene.id}:${variant.id}`])
      fail(`Unreachable variant ${scene.id}:${variant.id}`);
// Totality of transitions: leaving every scene must still reach a final gesture.
let skipped = event(initialState(), {
  type: 'run_started',
  contentVersion: content.version,
});
for (let step = 0; step < 25; step++) {
  const scene = nextScene(skipped, content);
  if (!scene) break;
  skipped = event(skipped, {
    type: 'scene_entered',
    sceneId: scene.id,
    sceneVersion: scene.version,
  });
  skipped = event(skipped, { type: 'scene_skipped', sceneId: scene.id });
}
if (nextScene(skipped, content) || skipped.visited.at(-1) !== 't1.coda')
  fail('Skipping must terminate at the coda');
console.log(
  `Validated ${content.scenes.length} scenes and 500 seeded runs. Scene coverage:`,
  hits,
  'Variant coverage:',
  variants,
);

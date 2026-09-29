import { content, copy } from '../src/content';
import { contentT2 } from '../src/content/t2';
import { contentT3 } from '../src/content/t3';
import registry from '../src/content/contracts.json';
import {
  sceneSchema,
  principleSchema,
  observationSchema,
} from '../src/engine/schema';
import {
  initialState,
  nextScene,
  reduce,
  registryDrift,
  sceneOptions,
  validateEvent,
  type Condition,
  type Content,
  type Effect,
  type GameEvent,
  type Scene,
} from '../src/engine';
import { migrateSave } from '../src/persistence/migrations';
import { defaultSettings } from '../src/persistence/SaveAdapter';
import { seeded, simulateJourney3 } from './simulation';

const fail = (message: string): never => {
  throw new Error(message);
};
const RUNS = Number(process.env.LAW_RUNS ?? 2000);
const allScenes = new Map<string, Scene>(
  [...content.scenes, ...contentT2.scenes, ...contentT3.scenes].map((scene) => [
    scene.id,
    scene,
  ]),
);
const characters = new Set(Object.keys(copy.people));

function validateTimeline(timeline: Content) {
  const own = new Set<string>();
  for (const scene of timeline.scenes) {
    sceneSchema.parse(scene);
    if (scene.timelineId !== timeline.timelineId)
      fail(`${scene.id} is not in ${timeline.timelineId}`);
    if (own.has(scene.id)) fail(`Duplicate scene ${scene.id}`);
    own.add(scene.id);
  }
  const known = new Set([...own, ...(timeline.inherits?.sceneIds ?? [])]);
  const principleIds = new Set(timeline.principles.map((p) => p.id));
  const statements = new Set(
    timeline.principles.flatMap((p) => p.statements.map((s) => s.id)),
  );
  for (const principle of timeline.principles) principleSchema.parse(principle);
  for (const observation of timeline.observations)
    observationSchema.parse(observation);
  for (const id of timeline.order)
    if (!own.has(id)) fail(`Order names unknown scene ${id}`);
  for (const id of Object.values(timeline.flow))
    if (id && !own.has(id)) fail(`Flow names unknown scene ${id}`);
  const checkCondition = (c: Condition): void => {
    if ('all' in c) c.all.forEach(checkCondition);
    else if ('any' in c) c.any.forEach(checkCondition);
    else if ('not' in c) checkCondition(c.not);
    else if ('chose' in c) {
      if (!known.has(c.chose.sceneId)) fail(`Unknown scene ${c.chose.sceneId}`);
      const scene = allScenes.get(c.chose.sceneId);
      if (
        scene &&
        sceneOptions(scene).size &&
        !sceneOptions(scene).has(c.chose.optionId)
      )
        fail(`Unknown option ${c.chose.sceneId}:${c.chose.optionId}`);
    } else if (
      'value' in c &&
      !('var' in c) &&
      typeof c.value === 'object' &&
      !known.has(c.value.sceneId)
    )
      fail(`Unknown scene ${c.value.sceneId}`);
    else if ('visited' in c && !known.has(c.visited))
      fail(`Unknown scene ${c.visited}`);
    else if ('answered' in c && !known.has(c.answered))
      fail(`Unknown scene ${c.answered}`);
    else if ('law' in c && !principleIds.has(c.law.principleId))
      fail(`Unknown principle ${c.law.principleId}`);
    else if ('relation' in c && !characters.has(c.relation.characterId))
      fail(`Unknown character ${c.relation.characterId}`);
  };
  const templates = (text: string) => {
    for (const token of text.match(/\{\{[^{}]+\}\}/g) ?? [])
      if (
        !token.includes('|') &&
        !['{{n}}', '{{scène}}', '{{secondes}}'].includes(token)
      )
        fail(`Template has no fallback: ${token}`);
    if (/"/.test(text)) fail(`Straight quote: ${text}`);
  };
  const checkEffect = (e: Effect): void => {
    if ('if' in e) {
      checkCondition(e.if);
      e.then.forEach(checkEffect);
    }
    if ('schedule' in e) {
      if (!own.has(e.schedule.sceneId))
        fail(`Unknown schedule ${e.schedule.sceneId}`);
      if (e.schedule.when) checkCondition(e.schedule.when);
    }
    if (
      'proposeLaw' in e &&
      (!principleIds.has(e.proposeLaw.principleId) ||
        !statements.has(e.proposeLaw.statementId))
    )
      fail('Unknown proposed law');
    if ('relationEvent' in e && !characters.has(e.relationEvent.characterId))
      fail(`Unknown character ${e.relationEvent.characterId}`);
  };
  for (const scene of timeline.scenes) {
    if (scene.when) checkCondition(scene.when);
    const options = sceneOptions(scene);
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
      if ('optionId' in o.when && options.size && !options.has(o.when.optionId))
        fail(`Invalid outcome ${o.when.optionId} in ${scene.id}`);
      o.beats.forEach((b) => {
        templates(b.text);
        if (b.requires) checkCondition(b.requires);
      });
      if (o.fact) templates(o.fact);
      (o.effects ?? []).forEach(checkEffect);
    }
    // Every option must lead somewhere a player can read.
    for (const id of options.keys())
      if (
        !scene.outcomes.some(
          (o) =>
            'any' in o.when || ('optionId' in o.when && o.when.optionId === id),
        )
      )
        fail(`Option ${scene.id}:${id} has no outcome`);
    for (const input of [
      scene.input,
      ...(scene.variants ?? []).map((v) => v.input),
    ])
      if (input && 'options' in input)
        for (const option of input.options ?? [])
          for (const evidence of option.evidence ?? []) {
            if (!principleIds.has(evidence.principleId))
              fail(`Unknown evidence principle ${evidence.principleId}`);
            if (evidence.when) checkCondition(evidence.when);
          }
  }
  for (const rule of timeline.observations) {
    checkCondition(rule.when);
    templates(rule.text);
  }
  timeline.principles.forEach((p) =>
    p.statements.forEach((s) => templates(s.text)),
  );
}

validateTimeline(content);
validateTimeline(contentT2);
validateTimeline(contentT3);
copy.onboarding.forEach((b) => {
  if (/"/.test(b.text)) fail(`Straight quote: ${b.text}`);
});

// Append-only scene contracts: rules never change under a recorded version.
const drift = registryDrift(registry, [content, contentT2, contentT3]);
if (drift.changed.length)
  fail(`Scene contracts changed without a version bump: ${drift.changed}`);
if (drift.missing.length)
  fail(
    `Unregistered scene versions: ${drift.missing} (pnpm contracts --write)`,
  );

const hits: Record<string, number> = {};
const variantHits: Record<string, number> = {};
const answers: Record<string, Set<string>> = { t1: new Set(), t2: new Set() };
const endings = new Set<string>();
let rendered = 0;
let confrontationsT2 = 0;
let inheritedConfrontations = 0;
const rand = seeded(571);
const clock = { at: 0 };
const save = (timelineId: 't1' | 't2' | 't3', events: GameEvent[]) => ({
  schemaVersion: 4,
  timelineId,
  contentVersion:
    timelineId === 't1'
      ? content.version
      : timelineId === 't2'
        ? contentT2.version
        : contentT3.version,
  runId: `run-${clock.at}`,
  createdAt: 1,
  updatedAt: 1,
  events,
  settings: defaultSettings,
});
let rulesEnacted = 0;
for (let run = 0; run < RUNS; run++) {
  const skipRate = run % 10 === 0 ? 0.35 : 0.04;
  const { room, house, city } = simulateJourney3(
    content,
    contentT2,
    contentT3,
    rand,
    clock,
    skipRate,
  );
  for (const result of [room, house, city]) {
    for (const id of result.visited) hits[id] = (hits[id] ?? 0) + 1;
    for (const id of result.variants)
      variantHits[id] = (variantHits[id] ?? 0) + 1;
    rendered += result.rendered;
    if (result.state.pendingConfrontations.length)
      fail(`Unprocessed confrontation in run ${run}`);
    for (const contradiction of result.state.contradictions)
      if (
        !result.events.some((e) => e.id === contradiction.choiceEventId) ||
        !result.events.some((e) => e.id === contradiction.lawEventId)
      )
        fail(`Contradiction without historical evidence in run ${run}`);
  }
  room.answers.forEach((a) => answers.t1!.add(a));
  house.answers.forEach((a) => answers.t2!.add(a));
  if (room.state.visited.at(-1) !== 't1.coda') fail(`T1 coda not final ${run}`);
  if (house.state.visited.at(-1) !== 't2.la-maison')
    fail(`T2 ending not final ${run}`);
  if (city.state.visited.at(-1) !== 't3.sortie')
    fail(`T3 ending not final ${run}`);
  confrontationsT2 += house.state.contradictions.length;
  inheritedConfrontations += house.state.contradictions.filter((c) =>
    house.state.laws.some((l) => l.number === c.lawNumber && l.inheritedFrom),
  ).length;
  // A seat always decides who walks the player out, or that nobody does.
  const seat = house.state.choices['t2.les-nouvelles'];
  if (seat) endings.add(String(seat));
  // A rule, once enacted, is never overwritten — only ever added beside.
  const rule = city.state.rules.find((r) => r.ruleId === 'attribution');
  if (rule) {
    if (rule.events[0]?.kind !== 'enacted')
      fail(`Rule attribution did not start with enactment in run ${run}`);
    rulesEnacted++;
  }
  // Persistence accepts exactly what the player flow produces, all three journals.
  migrateSave(save('t1', room.events), content);
  migrateSave(save('t2', house.events), contentT2);
  migrateSave(save('t3', city.events), contentT3);
}
for (const scene of [
  ...content.scenes,
  ...contentT2.scenes,
  ...contentT3.scenes,
])
  if (!hits[scene.id]) fail(`Unreachable scene ${scene.id}`);
for (const scene of [
  ...content.scenes,
  ...contentT2.scenes,
  ...contentT3.scenes,
])
  for (const variant of scene.variants ?? [])
    if (!variantHits[`${scene.id}:${variant.id}`])
      fail(`Unreachable variant ${scene.id}:${variant.id}`);
for (const [timeline, set] of Object.entries(answers))
  if (set.size !== 4) fail(`${timeline}: some confrontation answers never ran`);
if (!inheritedConfrontations)
  fail('No law signed in the room was ever confronted in the house');
if (!rulesEnacted) fail('The attribution rule was never enacted in the city');

// Totality of transitions: leaving every scene must still reach a final gesture.
for (const timeline of [content, contentT2, contentT3]) {
  let serial = 0;
  let skipped = initialState();
  const push = (draft: Record<string, unknown>) => {
    const event = { ...draft, id: `s${++serial}`, at: serial } as GameEvent;
    validateEvent(event, skipped, timeline);
    skipped = reduce(skipped, event, timeline);
  };
  push({ type: 'run_started', contentVersion: timeline.version });
  if (timeline.inherits)
    push({
      type: 'memory_inherited',
      fromTimelineId: timeline.inherits.timelineId,
      fromRunId: 'skipped',
      memory: {
        completedAt: 0,
        decisions: 0,
        choices: {},
        justifications: {},
        flags: [],
        vars: {},
        evidence: {},
        laws: [],
        declinedLaws: [],
        relations: [],
        rules: [],
        certainty: {},
        contradictions: [],
      },
    });
  for (let step = 0; step < 40; step++) {
    const scene = nextScene(skipped, timeline);
    if (!scene) break;
    push({
      type: 'scene_entered',
      sceneId: scene.id,
      sceneVersion: scene.version,
    });
    push({ type: 'scene_skipped', sceneId: scene.id });
  }
  if (
    nextScene(skipped, timeline) ||
    skipped.visited.at(-1) !== timeline.flow.codaSceneId
  )
    fail(`Skipping must terminate at the coda of ${timeline.timelineId}`);
  push({ type: 'run_completed', timelineId: timeline.timelineId });
}

console.log(
  `Validated ${content.scenes.length + contentT2.scenes.length + contentT3.scenes.length} scenes, ${Object.keys(registry).length} registered contracts, ${RUNS} seeded T1→T2→T3 journeys (${rendered} rendered texts, ${confrontationsT2} confrontations in the house, ${inheritedConfrontations} of laws signed in the room, ${rulesEnacted} rules enacted in the city).`,
);
console.log('Scene coverage:', hits);
console.log('Variant coverage:', variantHits);

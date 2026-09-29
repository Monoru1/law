import { talkOf } from './talk';
import type {
  Condition,
  Content,
  Effect,
  Scene,
  TalkNode,
  TalkSpec,
} from './types';

// Narrative audit: what a player could never reach, what a scene reads that
// nothing ever writes, where a conversation cannot end. Pure and static, so it
// runs in the validation script and in tests alike.

function conditionsOf(condition: Condition, into: Condition[]) {
  into.push(condition);
  if ('all' in condition) condition.all.forEach((c) => conditionsOf(c, into));
  else if ('any' in condition)
    condition.any.forEach((c) => conditionsOf(c, into));
  else if ('not' in condition) conditionsOf(condition.not, into);
}

function effectsOf(effect: Effect, into: Effect[]) {
  into.push(effect);
  if ('if' in effect) effect.then.forEach((e) => effectsOf(e, into));
}

type Facts = {
  reads: Condition[];
  writes: Effect[];
};

function talkFacts(talk: TalkSpec, facts: Facts) {
  const read = (c: Condition | undefined) => c && conditionsOf(c, facts.reads);
  const write = (list: Effect[] | undefined) =>
    list?.forEach((e) => effectsOf(e, facts.writes));
  for (const node of talk.nodes) {
    node.lines?.forEach((line) => read(line.requires));
    write(node.effects);
    node.route?.forEach((r) => read(r.when));
    node.ask?.replies.forEach((reply) => {
      read(reply.requires);
      write(reply.effects);
    });
    write(node.write?.effects);
  }
}

function sceneFacts(scene: Scene): Facts {
  const facts: Facts = { reads: [], writes: [] };
  const read = (c: Condition | undefined) => c && conditionsOf(c, facts.reads);
  read(scene.when);
  scene.beats.forEach((b) => read(b.requires));
  scene.variants?.forEach((v) => {
    read(v.when);
    v.beats?.forEach((b) => read(b.requires));
  });
  for (const outcome of scene.outcomes) {
    outcome.beats.forEach((b) => read(b.requires));
    outcome.effects?.forEach((e) => effectsOf(e, facts.writes));
  }
  const talk = talkOf(scene);
  if (talk) talkFacts(talk, facts);
  return facts;
}

/** Structural problems of one conversation graph. */
export function auditTalk(scene: Scene): string[] {
  const talk = talkOf(scene);
  if (!talk) return [];
  const problems: string[] = [];
  const at = (message: string) => problems.push(`${scene.id}: ${message}`);
  const ids = new Set<string>();
  for (const node of talk.nodes) {
    if (ids.has(node.id)) at(`duplicate node ${node.id}`);
    ids.add(node.id);
  }
  if (!ids.has(talk.start)) at(`unknown start ${talk.start}`);
  const outcomes = new Set(
    scene.outcomes.flatMap((o) =>
      'optionId' in o.when ? [o.when.optionId] : [],
    ),
  );
  const successors = (node: TalkNode, index: number): string[] => {
    const following = talk.nodes[index + 1]?.id;
    const out: string[] = [];
    const explicit = (target: string | undefined, what: string) => {
      if (target === undefined) return;
      if (!ids.has(target))
        at(`${node.id} ${what} names unknown node ${target}`);
      else out.push(target);
    };
    if (node.end !== undefined) return out;
    node.route?.forEach((r) => explicit(r.next, 'route'));
    if (node.ask) {
      const seen = new Set<string>();
      for (const reply of node.ask.replies) {
        if (seen.has(reply.id)) at(`${node.id} duplicate reply ${reply.id}`);
        seen.add(reply.id);
        if (reply.next === undefined && following === undefined)
          at(`${node.id}:${reply.id} leads nowhere`);
        explicit(reply.next ?? following, `reply ${reply.id}`);
      }
      if (node.ask.timeoutMs && !node.ask.onTimeout)
        at(`${node.id} has a timeout but nowhere to go`);
      explicit(node.ask.onTimeout, 'timeout');
      if (node.ask.onTimeout && !node.ask.timeoutMs)
        at(`${node.id} names onTimeout without a duration`);
      return out;
    }
    if (node.write) {
      explicit(node.write.next ?? following, 'write');
      explicit(
        node.write.declineNext ?? node.write.next ?? following,
        'decline',
      );
      return out;
    }
    explicit(node.next ?? following, 'next');
    if (node.next === undefined && following === undefined && !node.route)
      at(`${node.id} leads nowhere`);
    return out;
  };
  const edges = new Map<string, string[]>();
  talk.nodes.forEach((node, index) =>
    edges.set(node.id, successors(node, index)),
  );
  const reachable = new Set<string>();
  const queue = [talk.start];
  while (queue.length) {
    const id = queue.pop()!;
    if (reachable.has(id) || !ids.has(id)) continue;
    reachable.add(id);
    queue.push(...(edges.get(id) ?? []));
  }
  for (const node of talk.nodes)
    if (!reachable.has(node.id)) at(`node ${node.id} is unreachable`);
  // Every reachable node must be able to reach an end: no conversation traps.
  const ends = new Set(
    talk.nodes.filter((n) => n.end !== undefined).map((n) => n.id),
  );
  const closing = new Set(ends);
  for (let changed = true; changed;) {
    changed = false;
    for (const [id, next] of edges)
      if (!closing.has(id) && next.some((n) => closing.has(n))) {
        closing.add(id);
        changed = true;
      }
  }
  for (const id of reachable)
    if (!closing.has(id)) at(`node ${id} cannot reach an end`);
  for (const node of talk.nodes)
    if (node.end !== undefined && !outcomes.has(node.end))
      at(`end ${node.end} has no outcome`);
  for (const outcome of outcomes)
    if (!talk.nodes.some((n) => n.end === outcome))
      at(`outcome ${outcome} is never ended on`);
  return problems;
}

/**
 * Whole-timeline audit. `known` lists the scenes of inherited memories, whose
 * flags, notes and lines a scene may read without this timeline writing them.
 */
export function auditContent(
  content: Content,
  inherited: Content[] = [],
): string[] {
  const problems: string[] = [];
  const own = new Map(content.scenes.map((s) => [s.id, s]));
  const everyScene = new Map<string, Scene>(own);
  for (const other of inherited)
    for (const scene of other.scenes) everyScene.set(scene.id, scene);
  const written = {
    flags: new Set<string>(),
    vars: new Set<string>(),
    tags: new Set<string>(),
  };
  const read = {
    flags: new Set<string>(),
    vars: new Set<string>(),
    tags: new Set<string>(),
  };
  const collect = (scene: Scene, into: typeof written, isWrite: boolean) => {
    const facts = sceneFacts(scene);
    if (isWrite)
      for (const e of facts.writes) {
        if ('setFlag' in e) into.flags.add(e.setFlag);
        if ('setVar' in e) into.vars.add(e.setVar);
        if ('incVar' in e) into.vars.add(e.incVar);
        if ('note' in e) e.note.tags.forEach((t) => into.tags.add(t));
      }
    else
      for (const c of facts.reads) {
        if ('flag' in c) into.flags.add(c.flag);
        if ('var' in c) into.vars.add(c.var);
        if ('noted' in c) into.tags.add(c.noted.tag);
      }
  };
  for (const scene of everyScene.values()) collect(scene, written, true);
  for (const scene of own.values()) collect(scene, read, false);
  for (const scene of own.values()) {
    problems.push(...auditTalk(scene));
    for (const c of sceneFacts(scene).reads) {
      if ('said' in c) {
        const target = everyScene.get(c.said.sceneId);
        const talk = target && talkOf(target);
        const node = talk?.nodes.find((n) => n.id === c.said.nodeId);
        if (!node)
          problems.push(
            `${scene.id}: reads a line that does not exist (${c.said.sceneId}/${c.said.nodeId})`,
          );
        else if (
          c.said.optionId &&
          !node.ask?.replies.some((r) => r.id === c.said.optionId) &&
          !['written', 'declined', 'timeout'].includes(c.said.optionId)
        )
          problems.push(
            `${scene.id}: reads an unknown reply ${c.said.nodeId}:${c.said.optionId}`,
          );
      }
    }
  }
  for (const flag of read.flags)
    if (!written.flags.has(flag))
      problems.push(`flag ${flag} is read but never set`);
  for (const variable of read.vars)
    if (!written.vars.has(variable))
      problems.push(`variable ${variable} is read but never written`);
  for (const tag of read.tags)
    if (!written.tags.has(tag))
      problems.push(`note ${tag} is read but never written`);
  for (const id of content.order)
    if (!own.has(id)) problems.push(`order names unknown scene ${id}`);
  if (!own.has(content.flow.codaSceneId))
    problems.push(
      `timeline has no exit: coda ${content.flow.codaSceneId} is unknown`,
    );
  return problems;
}

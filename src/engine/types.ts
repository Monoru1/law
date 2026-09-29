export type Scalar = number | string | boolean;
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { flag: string }
  | { var: string; op: '==' | '!=' | '>' | '>=' | '<' | '<='; value: Scalar }
  | { chose: { sceneId: string; optionId: string } }
  | {
      value: {
        sceneId: string;
        op: '>' | '>=' | '<' | '<=' | '==';
        value: number;
      };
    }
  | { answered: string }
  | {
      law: {
        principleId: string;
        status: 'signed' | 'declined' | 'abandoned' | 'none';
      };
    }
  | { contradiction: 'pending' | 'none' }
  | { visited: string }
  | { relation: { characterId: string; kind: RelationEventKind } }
  // True when the given criterion is the one currently in force for that
  // rule — its latest enactment or revision, never an earlier one.
  | { rule: { ruleId: string; criterionId: string } }
  // A note LAW holds, optionally narrowed by what kind of knowledge it is and
  // whether the player accepted, nuanced, refused or withdrew it.
  | { noted: { tag: string; status?: NoteStatus; stance?: NoteStance } }
  // What the player actually did at a point of a conversation.
  | {
      said: {
        sceneId: string;
        nodeId: string;
        optionId?: string;
        mode?: LineMode;
      };
    };
export type Effect =
  | { setFlag: string }
  | { setVar: string; value: Scalar }
  | { incVar: string; by: number | { fromValueOf: string } }
  | { schedule: { sceneId: string; when?: Condition } }
  | { proposeLaw: { principleId: string; statementId: string } }
  | { relationEvent: { characterId: string; kind: RelationEventKind } }
  // A collective rule: enacted once, revised by a new entry that never
  // overwrites the former one, applied to a named person, or excepted for
  // one. All four are recorded the way a relation is — stamped with the
  // choice that produced them, never rewritten afterward.
  | { ruleEnacted: { ruleId: string; criterionId: string } }
  | { ruleRevised: { ruleId: string; criterionId: string } }
  | { ruleApplied: { ruleId: string; personId: string; outcome: string } }
  | { exceptionGranted: { ruleId: string; personId: string } }
  // LAW writes something down. The stamp is the line that produced it.
  | { note: NoteSpec }
  // The player answers a note LAW holds: the latest note with this tag.
  | { stance: { tag: string; stance: NoteStance } }
  // Conditional effects are evaluated against the state that already holds
  // the choice being applied; they never read a clock or the browser.
  | { if: Condition; then: Effect[] };
export type Beat = {
  text: string;
  pauseMs?: number;
  style?: 'normal' | 'whisper' | 'meta' | 'emphasis';
  requires?: Condition;
};
export type Evidence = {
  principleId: string;
  weight: number;
  // Evaluated against the state before the choice is applied.
  when?: Condition;
};
export type OptionSpec = {
  id: string;
  label: string;
  evidence?: Evidence[];
};
export type InputSpec =
  | {
      kind: 'binary';
      options: [OptionSpec, OptionSpec];
      confirm: 'tap' | 'hold';
    }
  | { kind: 'choice'; options: OptionSpec[]; confirm: 'tap' | 'hold' }
  | {
      kind: 'slider';
      min: number;
      max: number;
      step: number;
      unit: string;
      labelTemplate: string;
      zeroLabel?: string;
      confirm: 'tap' | 'hold';
    }
  | {
      kind: 'freeText';
      prompt: string;
      placeholder: string;
      maxLength: number;
      skippable: true;
    }
  | { kind: 'glyph'; options: OptionSpec[]; confirm: 'tap' | 'hold' }
  | { kind: 'passage' }
  | { kind: 'lawProposal' }
  | { kind: 'confrontation' }
  | { kind: 'talk'; talk: TalkSpec };
export type FutureInputKind = 'rank' | 'pickPerson' | 'number' | 'collective';
export type Outcome = {
  when: { optionId: string } | { range: [number, number] } | { any: true };
  beats: Beat[];
  effects?: Effect[];
  // Past-tense statement of what the player did, placed beside other acts by
  // confrontations and inherited memory. Presentation only.
  fact?: string;
};
export type RelationEventKind =
  | 'promise_made'
  | 'promise_kept'
  | 'promise_broken'
  | 'lie_made'
  | 'lie_revealed'
  | 'truth_told'
  | 'secret_kept'
  | 'secret_told'
  | 'chose_over'
  | 'protected'
  | 'sacrificed';
// Derived from the choice that produced it: the event ID and time are the
// choice's own, so replay stays deterministic.
export type RelationRecord = {
  characterId: string;
  events: {
    kind: RelationEventKind;
    sceneId: string;
    at: number;
    eventId: string;
  }[];
};
export type RuleEventKind = 'enacted' | 'revised' | 'applied' | 'exception';
// A collective rule's whole history: which criterion was in force when, who
// it was applied to, and every exception — never pruned, never rewritten.
export type RuleRecord = {
  ruleId: string;
  events: {
    kind: RuleEventKind;
    criterionId?: string;
    personId?: string;
    outcome?: string;
    sceneId: string;
    at: number;
    eventId: string;
  }[];
};
// A closed, factual line for a resolved contradiction: what was signed, what
// contradicted it, and how the player answered — no interpretation.
export type ContradictionSummary = {
  lawNumber: number | null;
  principleId: string;
  sceneId: string;
  raised: boolean;
  answer?: 'maintain' | 'nuance' | 'abandon' | 'silence';
};
// What LAW knows is never one kind of thing. A fact is something that
// happened, an observation is something measured about it, an inference is
// LAW's own reading (contestable), a declared law is the player's own words.
export type NoteKind =
  | 'justification'
  | 'intention'
  | 'silence'
  | 'promise'
  | 'question'
  | 'reversal'
  | 'curiosity'
  | 'refusal'
  | 'quote'
  | 'interpretation'
  | 'declared';
export type NoteStatus = 'fact' | 'observation' | 'inference' | 'declared';
export type NoteStance =
  'open' | 'accepted' | 'nuanced' | 'refused' | 'withdrawn';
export type NoteSpec = {
  kind: NoteKind;
  status?: NoteStatus;
  tags: string[];
  // Keep the exact words the player wrote at this point of the conversation.
  fromText?: boolean;
  // Authored text, for an inference LAW states about the player.
  text?: string;
};
export type Note = {
  id: string;
  kind: NoteKind;
  status: NoteStatus;
  tags: string[];
  sceneId: string;
  eventId: string;
  at: number;
  text?: string;
  stance: NoteStance;
};

// A conversation: a graph of nodes walked by recorded lines, never by a clock.
export type LineMode = 'reply' | 'silence' | 'timeout' | 'written' | 'declined';
export type TalkLine = {
  // 'law', 'narrator', or a character ID.
  who: string;
  text: string;
  pauseMs?: number;
  style?: 'normal' | 'whisper' | 'meta' | 'emphasis';
  requires?: Condition;
};
export type TalkReply = {
  id: string;
  label: string;
  // Where the conversation goes. Omitted: the node that follows in the array.
  next?: string;
  effects?: Effect[];
  evidence?: Evidence[];
  requires?: Condition;
  // Hidden once used at this node, so a question is never asked twice.
  once?: boolean;
  // An explicit choice to say nothing: recorded as a silence, not a reply.
  silent?: boolean;
  // Irreversible: needs a deliberate press-and-hold.
  hold?: boolean;
};
export type TalkNode = {
  id: string;
  lines?: TalkLine[];
  // Applied once, when the conversation reaches this node.
  effects?: Effect[];
  ask?: {
    replies: TalkReply[];
    // Time to answer. Letting it pass is recorded as a timeout, distinct from
    // choosing silence.
    timeoutMs?: number;
    onTimeout?: string;
  };
  write?: {
    prompt: string;
    placeholder: string;
    maxLength: number;
    next?: string;
    declineNext?: string;
    declineLabel?: string;
    effects?: Effect[];
  };
  route?: { when: Condition; next: string }[];
  next?: string;
  // Ends the conversation on that outcome of the scene.
  end?: string;
};
export type TalkSpec = { start: string; nodes: TalkNode[] };
export type TalkTrailItem = {
  nodeId: string;
  reply?: { optionId: string; mode: LineMode; text?: string };
};
export type TalkState = {
  // The node waiting for the player; null once the conversation has ended.
  cursor: string | null;
  // The outcome the conversation ended on, once it has.
  end: string | null;
  trail: TalkTrailItem[];
};
export type LineRecord = {
  sceneId: string;
  nodeId: string;
  optionId: string;
  mode: LineMode;
  text?: string;
  eventId: string;
  at: number;
  hesitationMs: number;
};
export type Scene = {
  id: string;
  version: number;
  timelineId: string;
  title: string;
  regression: 0 | 1 | 2 | 3;
  contentFlags: string[];
  when?: Condition;
  priority?: number;
  variants?: {
    id: string;
    when: Condition;
    beats?: Beat[];
    input?: Partial<InputSpec>;
  }[];
  beats: Beat[];
  input: InputSpec;
  outcomes: Outcome[];
  followUps?: ('certainty' | 'lawProposal')[];
  audio?: { ambience?: string; cues?: string[] };
};
export type ChoiceValue = string | number;
export type LawOrigin = {
  sceneId: string;
  eventId: string;
  // Frozen text for a law inherited from an earlier timeline.
  text?: string;
};
export type InheritedLaw = {
  number: number;
  principleId: string;
  statementId: string | null;
  statementText: string;
  customText?: string;
  status: 'signed' | 'abandoned';
  revisions: Law['revisions'];
  origin?: { sceneId: string; text: string };
};
// A frozen summary of a completed timeline, copied into the next journal at
// its start. The next timeline never reads the earlier save again. It carries
// facts only — no score, no interpretation — so a future Tribunal can quote
// them exactly, and each later timeline composes transitively: a memory built
// after inheriting one already contains what it inherited.
export type Memory = {
  completedAt: number;
  decisions: number;
  choices: Record<string, ChoiceValue>;
  justifications: Record<string, string>;
  flags: string[];
  vars: Record<string, Scalar>;
  evidence: Record<string, number>;
  laws: InheritedLaw[];
  declinedLaws: string[];
  relations: RelationRecord[];
  rules: RuleRecord[];
  certainty: Record<string, number>;
  contradictions: ContradictionSummary[];
  notes?: Note[];
  lines?: LineRecord[];
};
export type GameEvent =
  | { type: 'run_started'; id: string; at: number; contentVersion: string }
  | {
      type: 'scene_entered';
      id: string;
      at: number;
      sceneId: string;
      sceneVersion: number;
    }
  | {
      type: 'choice_locked';
      id: string;
      at: number;
      sceneId: string;
      sceneVersion: number;
      input: InputSpec['kind'];
      value: ChoiceValue;
      hesitationMs: number;
      selectionChanges: number;
    }
  | {
      type: 'line_chosen';
      id: string;
      at: number;
      sceneId: string;
      sceneVersion: number;
      nodeId: string;
      optionId: string;
      mode: LineMode;
      text?: string;
      hesitationMs: number;
    }
  | {
      type: 'certainty_given';
      id: string;
      at: number;
      sceneId: string;
      value: number;
    }
  | {
      type: 'justification_given';
      id: string;
      at: number;
      sceneId: string;
      text: string;
    }
  | { type: 'justification_declined'; id: string; at: number; sceneId: string }
  | {
      type: 'law_proposed';
      id: string;
      at: number;
      principleId: string;
      statementId: string;
    }
  | {
      type: 'law_signed';
      id: string;
      at: number;
      lawNumber: number;
      principleId: string;
      statementId: string;
      // The exact sentence the player signed, frozen at signature time.
      statementText?: string;
    }
  | { type: 'law_declined'; id: string; at: number; principleId: string }
  | {
      type: 'law_revised';
      id: string;
      at: number;
      lawNumber: number;
      newStatementId: string | null;
      customText?: string;
      statementText?: string;
    }
  | { type: 'law_abandoned'; id: string; at: number; lawNumber: number }
  | {
      type: 'confrontation_answered';
      id: string;
      at: number;
      lawNumber: number | null;
      answer: 'maintain' | 'nuance' | 'abandon' | 'silence';
    }
  | { type: 'scene_skipped'; id: string; at: number; sceneId: string }
  | { type: 'run_completed'; id: string; at: number; timelineId: string }
  | {
      type: 'memory_inherited';
      id: string;
      at: number;
      fromTimelineId: string;
      fromRunId: string;
      memory: Memory;
    };
export type Law = {
  number: number;
  principleId: string;
  statementId: string | null;
  statementText?: string;
  customText?: string;
  status: 'signed' | 'abandoned';
  revisions: {
    at: number;
    statementId: string | null;
    statementText?: string;
    customText?: string;
    status: 'signed' | 'abandoned';
  }[];
  signedAtDecision: number;
  // The journal event that brought the law into this run.
  sourceEventId?: string;
  origin?: LawOrigin;
  inheritedFrom?: string;
};
export type PendingConfrontation = {
  lawNumber: number | null;
  principleId: string;
  sceneId: string;
};
// Historical truth: a contradiction is backed by a choice and a signature.
export type Contradiction = PendingConfrontation & {
  choiceEventId: string;
  lawEventId: string;
  answerEventId?: string;
  // A law interrupts the player once per journal; later contradictions are
  // recorded without being raised.
  raised: boolean;
};
export type GameState = {
  events: GameEvent[];
  flags: string[];
  vars: Record<string, Scalar>;
  visited: string[];
  choices: Record<string, ChoiceValue>;
  certainty: Record<string, number>;
  justifications: Record<string, string>;
  laws: Law[];
  declinedLaws: string[];
  pendingLaws: { principleId: string; statementId: string }[];
  schedules: { sceneId: string; when?: Condition }[];
  pendingConfrontations: PendingConfrontation[];
  contradictions: Contradiction[];
  confronted: string[];
  evidence: Record<string, number>;
  // Last choice that gave positive evidence to each principle.
  support: Record<string, { sceneId: string; eventId: string }>;
  relations: RelationRecord[];
  rules: RuleRecord[];
  // Contradictions inherited from an earlier, already-closed timeline: kept
  // apart from `contradictions` (this run's own, still-open bookkeeping) so
  // this run's memory can carry both forward without re-raising the old ones.
  inheritedContradictions: ContradictionSummary[];
  notes: Note[];
  lines: LineRecord[];
  talk: Record<string, TalkState>;
  completed: boolean;
  currentSceneId: string | null;
  decisions: number;
};
export type Principle = {
  id: string;
  statements: { id: string; text: string; isDefault?: boolean }[];
  opposite?: string;
};
export type ObservationRule = {
  id: string;
  when: Condition;
  text: string;
  minDecisions?: number;
};
export type TimelineConfig = {
  /** Scene ID that handles confrontation resolution. Empty string = no confrontation mechanic. */
  confrontationSceneId: string;
  /** Scene shown after the checkpoint when a law is signed but not yet contradicted. */
  pasEncoreSceneId: string;
  /** Scene shown when evidence is high but no law was signed. */
  confrontationUnsignedSceneId: string;
  /** Scene after which the law checkpoint scenes may appear. */
  checkpointSceneId: string;
  /** Scene that ends the timeline (visited = no further scenes). */
  codaSceneId: string;
};
export type Content = {
  timelineId: string;
  // Release label. Save compatibility is decided per scene contract, not here.
  version: string;
  scenes: Scene[];
  principles: Principle[];
  observations: ObservationRule[];
  order: string[];
  flow: TimelineConfig;
  // A timeline that starts from the frozen memory of an earlier one.
  inherits?: { timelineId: string; sceneIds: string[]; place: string };
  // Further memories copied in right after the first, when the earlier
  // timeline was completed. Never required: a journal without one is valid.
  alsoInherits?: { timelineId: string; sceneIds: string[]; place: string }[];
};

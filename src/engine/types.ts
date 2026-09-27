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
  | { relation: { characterId: string; kind: RelationEventKind } };
export type Effect =
  | { setFlag: string }
  | { setVar: string; value: Scalar }
  | { incVar: string; by: number | { fromValueOf: string } }
  | { schedule: { sceneId: string; when?: Condition } }
  | { proposeLaw: { principleId: string; statementId: string } }
  | { relationEvent: { characterId: string; kind: RelationEventKind } }
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
  | { kind: 'confrontation' };
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
// its start. The next timeline never reads the earlier save again.
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
};

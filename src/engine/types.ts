export type Scalar = number | string | boolean;
export type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { flag: string } | { var: string; op: '==' | '!=' | '>' | '>=' | '<' | '<='; value: Scalar }
  | { chose: { sceneId: string; optionId: string } }
  | { value: { sceneId: string; op: '>' | '>=' | '<' | '<=' | '=='; value: number } }
  | { answered: string } | { law: { principleId: string; status: 'signed' | 'declined' | 'abandoned' | 'none' } }
  | { contradiction: 'pending' | 'none' } | { visited: string };
export type Effect = { setFlag: string } | { setVar: string; value: Scalar } | { incVar: string; by: number | { fromValueOf: string } } | { schedule: { sceneId: string; when?: Condition } } | { proposeLaw: { principleId: string; statementId: string } };
export type Beat = { text: string; pauseMs?: number; style?: 'normal' | 'whisper' | 'meta' | 'emphasis'; requires?: Condition };
export type OptionSpec = { id: string; label: string; evidence?: { principleId: string; weight: number }[] };
export type InputSpec =
  | { kind: 'binary'; options: [OptionSpec, OptionSpec]; confirm: 'tap' | 'hold' }
  | { kind: 'choice'; options: OptionSpec[]; confirm: 'tap' | 'hold' }
  | { kind: 'slider'; min: number; max: number; step: number; unit: string; labelTemplate: string; zeroLabel?: string; confirm: 'tap' | 'hold' }
  | { kind: 'freeText'; prompt: string; placeholder: string; maxLength: number; skippable: true }
  | { kind: 'glyph'; options: OptionSpec[]; confirm: 'tap' | 'hold' }
  | { kind: 'lawProposal' } | { kind: 'confrontation' };
export type FutureInputKind = 'rank' | 'pickPerson' | 'number' | 'collective';
export type Outcome = { when: { optionId: string } | { range: [number, number] } | { any: true }; beats: Beat[]; effects?: Effect[] };
export type Scene = { id: string; version: number; timelineId: 't1'; title: string; regression: 0 | 1 | 2 | 3; contentFlags: string[]; when?: Condition; priority?: number; variants?: { id: string; when: Condition; beats?: Beat[]; input?: Partial<InputSpec> }[]; beats: Beat[]; input: InputSpec; outcomes: Outcome[]; followUps?: ('certainty' | 'lawProposal')[]; audio?: { ambience?: string; cues?: string[] } };
export type ChoiceValue = string | number;
export type GameEvent =
  | { type: 'run_started'; id: string; at: number; contentVersion: string }
  | { type: 'scene_entered'; id: string; at: number; sceneId: string; sceneVersion: number }
  | { type: 'choice_locked'; id: string; at: number; sceneId: string; sceneVersion: number; input: InputSpec['kind']; value: ChoiceValue; hesitationMs: number; selectionChanges: number }
  | { type: 'certainty_given'; id: string; at: number; sceneId: string; value: number }
  | { type: 'justification_given'; id: string; at: number; sceneId: string; text: string }
  | { type: 'justification_declined'; id: string; at: number; sceneId: string }
  | { type: 'law_proposed'; id: string; at: number; principleId: string; statementId: string }
  | { type: 'law_signed'; id: string; at: number; lawNumber: number; principleId: string; statementId: string }
  | { type: 'law_declined'; id: string; at: number; principleId: string }
  | { type: 'law_revised'; id: string; at: number; lawNumber: number; newStatementId: string | null; customText?: string }
  | { type: 'law_abandoned'; id: string; at: number; lawNumber: number }
  | { type: 'confrontation_answered'; id: string; at: number; lawNumber: number | null; answer: 'maintain' | 'nuance' | 'abandon' | 'silence' }
  | { type: 'scene_skipped'; id: string; at: number; sceneId: string }
  | { type: 'run_completed'; id: string; at: number; timelineId: string };
export type Law = { number: number; principleId: string; statementId: string | null; customText?: string; status: 'signed' | 'abandoned'; revisions: { at: number; statementId: string | null; customText?: string; status: 'signed' | 'abandoned' }[]; signedAtDecision: number };
export type PendingConfrontation = { lawNumber: number | null; principleId: string; sceneId: string };
export type GameState = { events: GameEvent[]; flags: string[]; vars: Record<string, Scalar>; visited: string[]; choices: Record<string, ChoiceValue>; certainty: Record<string, number>; justifications: Record<string, string>; laws: Law[]; declinedLaws: string[]; pendingLaws: { principleId: string; statementId: string }[]; schedules: { sceneId: string; when?: Condition }[]; pendingConfrontations: PendingConfrontation[]; confronted: string[]; evidence: Record<string, number>; completed: boolean; currentSceneId: string | null; decisions: number };
export type Principle = { id: string; statements: { id: string; text: string; isDefault?: boolean }[]; opposite?: string };
export type ObservationRule = { id: string; when: Condition; text: string; minDecisions?: number };
export type Content = { version: string; scenes: Scene[]; principles: Principle[]; observations: ObservationRule[]; order: string[] };

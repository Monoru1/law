export type DecisionRecord = {
  order: number;
  sceneId: string;
  sceneTitle: string;
  inputKind: string;
  rawValue: string | number;
  displayValue: string;
  hesitationMs: number;
  selectionChanges: number;
  certainty?: number;
  justification?: string;
};

export type LawRecord = {
  // null for a proposition that was declined before ever being signed —
  // law numbers are only assigned at signature.
  number: number | null;
  principleId: string;
  currentStatement: string;
  status: 'active' | 'revised' | 'abandoned' | 'declined';
  signedAt: number | null;
  declinedAt?: number;
  revisions: Array<{ text: string; at: number }>;
};

export type ConfrontationRecord = {
  lawNumber: number | null;
  answer: 'maintain' | 'nuance' | 'abandon' | 'silence';
  displayAnswer: string;
  // The decision through which the player answered, when it can be
  // correlated from the event order. Not stored directly on the event.
  sceneId: string | null;
  sceneTitle: string | null;
  at: number;
};

export type PlaytestReport = {
  reportVersion: '1';
  contentVersion: string;
  runId: string;
  pseudonym: string;
  consentGiven: true;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  timelineId: string;
  decisions: DecisionRecord[];
  laws: LawRecord[];
  confrontations: ConfrontationRecord[];
  factualSummary: string[];
};

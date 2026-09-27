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
  number: number;
  principleId: string;
  currentStatement: string;
  status: 'active' | 'revised' | 'abandoned';
  signedAt: number;
  revisions: Array<{ text: string; at: number }>;
};

export type ConfrontationRecord = {
  lawNumber: number | null;
  answer: 'maintain' | 'nuance' | 'abandon' | 'silence';
  displayAnswer: string;
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

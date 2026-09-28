import { z } from 'zod';
export const relationKind = z.enum([
  'promise_made',
  'promise_kept',
  'promise_broken',
  'lie_made',
  'lie_revealed',
  'truth_told',
  'secret_kept',
  'secret_told',
  'chose_over',
  'protected',
  'sacrificed',
]);
const condition: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(condition) }),
    z.object({ any: z.array(condition) }),
    z.object({ not: condition }),
    z.object({ flag: z.string() }),
    z.object({
      var: z.string(),
      op: z.enum(['==', '!=', '>', '>=', '<', '<=']),
      value: z.union([z.number(), z.string(), z.boolean()]),
    }),
    z.object({
      chose: z.object({ sceneId: z.string(), optionId: z.string() }),
    }),
    z.object({
      value: z.object({
        sceneId: z.string(),
        op: z.enum(['>', '>=', '<', '<=', '==']),
        value: z.number(),
      }),
    }),
    z.object({ answered: z.string() }),
    z.object({
      law: z.object({
        principleId: z.string(),
        status: z.enum(['signed', 'declined', 'abandoned', 'none']),
      }),
    }),
    z.object({ contradiction: z.enum(['pending', 'none']) }),
    z.object({ visited: z.string() }),
    z.object({
      relation: z.object({ characterId: z.string(), kind: relationKind }),
    }),
    z.object({
      rule: z.object({ ruleId: z.string(), criterionId: z.string() }),
    }),
  ]),
);
export const beatSchema = z.object({
  text: z.string(),
  pauseMs: z.number().optional(),
  style: z.enum(['normal', 'whisper', 'meta', 'emphasis']).optional(),
  requires: condition.optional(),
});
const evidence = z.object({
  principleId: z.string(),
  weight: z.number().min(-1).max(1),
  when: condition.optional(),
});
const option = z.object({
  id: z.string(),
  label: z.string(),
  evidence: z.array(evidence).optional(),
});
const confirm = z.enum(['tap', 'hold']);
export const inputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('binary'),
    options: z.tuple([option, option]),
    confirm,
  }),
  z.object({
    kind: z.literal('choice'),
    options: z.array(option).min(1),
    confirm,
  }),
  z.object({
    kind: z.literal('glyph'),
    options: z.array(option).min(2),
    confirm,
  }),
  z.object({
    kind: z.literal('slider'),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    unit: z.string(),
    labelTemplate: z.string(),
    zeroLabel: z.string().optional(),
    confirm,
  }),
  z.object({
    kind: z.literal('freeText'),
    prompt: z.string(),
    placeholder: z.string(),
    maxLength: z.number().int().positive(),
    skippable: z.literal(true),
  }),
  z.object({ kind: z.literal('passage') }),
  z.object({ kind: z.literal('lawProposal') }),
  z.object({ kind: z.literal('confrontation') }),
]);
const effect: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ setFlag: z.string() }),
    z.object({
      setVar: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
    }),
    z.object({
      incVar: z.string(),
      by: z.union([z.number(), z.object({ fromValueOf: z.string() })]),
    }),
    z.object({
      schedule: z.object({ sceneId: z.string(), when: condition.optional() }),
    }),
    z.object({
      proposeLaw: z.object({
        principleId: z.string(),
        statementId: z.string(),
      }),
    }),
    z.object({
      relationEvent: z.object({ characterId: z.string(), kind: relationKind }),
    }),
    z.object({
      ruleEnacted: z.object({ ruleId: z.string(), criterionId: z.string() }),
    }),
    z.object({
      ruleRevised: z.object({ ruleId: z.string(), criterionId: z.string() }),
    }),
    z.object({
      ruleApplied: z.object({
        ruleId: z.string(),
        personId: z.string(),
        outcome: z.string(),
      }),
    }),
    z.object({
      exceptionGranted: z.object({ ruleId: z.string(), personId: z.string() }),
    }),
    z.object({ if: condition, then: z.array(effect) }),
  ]),
);
export const sceneSchema = z.object({
  id: z.string().regex(/^t[1-4]\.[a-z-]+$/),
  version: z.number().int().positive(),
  timelineId: z.enum(['t1', 't2', 't3', 't4']),
  title: z.string(),
  regression: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  contentFlags: z.array(z.string()),
  when: condition.optional(),
  priority: z.number().optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        when: condition,
        beats: z.array(beatSchema).optional(),
        input: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .optional(),
  beats: z.array(beatSchema),
  input: inputSchema,
  outcomes: z.array(
    z.object({
      when: z.union([
        z.object({ optionId: z.string() }),
        z.object({ range: z.tuple([z.number(), z.number()]) }),
        z.object({ any: z.literal(true) }),
      ]),
      beats: z.array(beatSchema),
      effects: z.array(effect).optional(),
      fact: z.string().optional(),
    }),
  ),
  followUps: z.array(z.enum(['certainty', 'lawProposal'])).optional(),
  audio: z
    .object({
      ambience: z.string().optional(),
      cues: z.array(z.string()).optional(),
    })
    .optional(),
});
export const principleSchema = z.object({
  id: z.string(),
  statements: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        isDefault: z.boolean().optional(),
      }),
    )
    .min(1),
  opposite: z.string().optional(),
});
export const observationSchema = z.object({
  id: z.string(),
  when: condition,
  text: z.string(),
  minDecisions: z.number().optional(),
});
const scalar = z.union([z.number(), z.string().max(64), z.boolean()]);
const revision = z.object({
  at: z.number(),
  statementId: z.string().nullable(),
  statementText: z.string().max(400).optional(),
  customText: z.string().max(280).optional(),
  status: z.enum(['signed', 'abandoned']),
});
// Bounded so an inherited memory can never become an unbounded payload.
const memorySchema = z.object({
  completedAt: z.number(),
  decisions: z.number().int().nonnegative(),
  choices: z
    .record(z.string().max(64), z.union([z.string().max(64), z.number()]))
    .refine((value) => Object.keys(value).length <= 40),
  justifications: z
    .record(z.string().max(64), z.string().max(280))
    .refine((value) => Object.keys(value).length <= 40),
  flags: z.array(z.string().max(64)).max(80),
  vars: z
    .record(z.string().max(64), scalar)
    .refine((value) => Object.keys(value).length <= 40),
  evidence: z
    .record(z.string().max(64), z.number())
    .refine((value) => Object.keys(value).length <= 40),
  laws: z
    .array(
      z.object({
        number: z.number().int().positive(),
        principleId: z.string(),
        statementId: z.string().nullable(),
        statementText: z.string().max(400),
        customText: z.string().max(280).optional(),
        status: z.enum(['signed', 'abandoned']),
        revisions: z.array(revision).max(40),
        origin: z
          .object({ sceneId: z.string(), text: z.string().max(400) })
          .optional(),
      }),
    )
    .max(20),
  declinedLaws: z.array(z.string()).max(20),
  relations: z
    .array(
      z.object({
        characterId: z.string().max(64),
        events: z
          .array(
            z.object({
              kind: relationKind,
              sceneId: z.string().max(64),
              at: z.number(),
              eventId: z.string().max(64),
            }),
          )
          .max(40),
      }),
    )
    .max(40),
  rules: z
    .array(
      z.object({
        ruleId: z.string().max(64),
        events: z
          .array(
            z.object({
              kind: z.enum(['enacted', 'revised', 'applied', 'exception']),
              criterionId: z.string().max(64).optional(),
              personId: z.string().max(64).optional(),
              outcome: z.string().max(120).optional(),
              sceneId: z.string().max(64),
              at: z.number(),
              eventId: z.string().max(64),
            }),
          )
          .max(80),
      }),
    )
    .max(20),
  certainty: z
    .record(z.string().max(64), z.number().min(0).max(100))
    .refine((value) => Object.keys(value).length <= 40),
  contradictions: z
    .array(
      z.object({
        lawNumber: z.number().nullable(),
        principleId: z.string(),
        sceneId: z.string().max(64),
        raised: z.boolean(),
        answer: z.enum(['maintain', 'nuance', 'abandon', 'silence']).optional(),
      }),
    )
    .max(40),
});
export const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('run_started'),
    id: z.string(),
    at: z.number(),
    contentVersion: z.string(),
  }),
  z.object({
    type: z.literal('scene_entered'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
    sceneVersion: z.number(),
  }),
  z.object({
    type: z.literal('choice_locked'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
    sceneVersion: z.number(),
    input: z.enum([
      'binary',
      'choice',
      'slider',
      'freeText',
      'glyph',
      'lawProposal',
      'confrontation',
    ]),
    value: z.union([z.string(), z.number()]),
    hesitationMs: z.number().nonnegative(),
    selectionChanges: z.number().nonnegative(),
  }),
  z.object({
    type: z.literal('certainty_given'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
    value: z.number().min(0).max(100),
  }),
  z.object({
    type: z.literal('justification_given'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
    text: z.string().max(280),
  }),
  z.object({
    type: z.literal('justification_declined'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
  }),
  z.object({
    type: z.literal('law_proposed'),
    id: z.string(),
    at: z.number(),
    principleId: z.string(),
    statementId: z.string(),
  }),
  z.object({
    type: z.literal('law_signed'),
    id: z.string(),
    at: z.number(),
    lawNumber: z.number(),
    principleId: z.string(),
    statementId: z.string(),
    statementText: z.string().max(400).optional(),
  }),
  z.object({
    type: z.literal('law_declined'),
    id: z.string(),
    at: z.number(),
    principleId: z.string(),
  }),
  z.object({
    type: z.literal('law_revised'),
    id: z.string(),
    at: z.number(),
    lawNumber: z.number(),
    newStatementId: z.string().nullable(),
    customText: z.string().max(280).optional(),
    statementText: z.string().max(400).optional(),
  }),
  z.object({
    type: z.literal('law_abandoned'),
    id: z.string(),
    at: z.number(),
    lawNumber: z.number(),
  }),
  z.object({
    type: z.literal('confrontation_answered'),
    id: z.string(),
    at: z.number(),
    lawNumber: z.number().nullable(),
    answer: z.enum(['maintain', 'nuance', 'abandon', 'silence']),
  }),
  z.object({
    type: z.literal('scene_skipped'),
    id: z.string(),
    at: z.number(),
    sceneId: z.string(),
  }),
  z.object({
    type: z.literal('run_completed'),
    id: z.string(),
    at: z.number(),
    timelineId: z.string(),
  }),
  z.object({
    type: z.literal('memory_inherited'),
    id: z.string(),
    at: z.number(),
    fromTimelineId: z.string(),
    fromRunId: z.string().max(64),
    memory: memorySchema,
  }),
]);
export const settingsSchema = z.object({
  simpleConfirmation: z.boolean(),
  reducedMotion: z.enum(['auto', 'on', 'off']),
  textSize: z.enum(['small', 'normal', 'large']),
  sound: z.boolean(),
});
// Schema 2 and 3: the whole interpreting content was embedded as identity.
export const legacySaveSchema = z.object({
  schemaVersion: z.number().int(),
  contentVersion: z.string(),
  runId: z.string(),
  contentIdentity: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  events: z.array(eventSchema),
  settings: settingsSchema,
  pseudonym: z.string().max(64).optional(),
  reportingConsent: z.boolean().optional(),
  reportingStatus: z.enum(['not_sent', 'sending', 'sent', 'failed']).optional(),
});
// Schema 4: compatibility is carried by each event's scene version, checked
// against the append-only contract registry.
export const saveSchema = z.object({
  schemaVersion: z.number().int(),
  timelineId: z.enum(['t1', 't2', 't3', 't4']),
  contentVersion: z.string().max(32),
  runId: z.string().min(1).max(64),
  createdAt: z.number(),
  updatedAt: z.number(),
  events: z.array(eventSchema).max(2000),
  settings: settingsSchema,
  pseudonym: z.string().max(64).optional(),
  reportingConsent: z.boolean().optional(),
  reportingStatus: z.enum(['not_sent', 'sending', 'sent', 'failed']).optional(),
});

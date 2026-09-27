import type { Content, InputSpec, Scene } from './types';

// Exact canonical form, without probabilistic hashes or browser globals.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

export const contractKey = (sceneId: string, version: number): string =>
  `${sceneId}@${version}`;

function inputContract(input: Partial<InputSpec> | undefined) {
  if (!input) return undefined;
  const options =
    'options' in input && Array.isArray(input.options)
      ? input.options.map((option) => ({
          id: option.id,
          evidence: option.evidence,
        }))
      : undefined;
  return {
    kind: input.kind,
    options,
    min: 'min' in input ? input.min : undefined,
    max: 'max' in input ? input.max : undefined,
    step: 'step' in input ? input.step : undefined,
  };
}

/**
 * The part of a scene that decides how a recorded event is interpreted:
 * accepted inputs, evidence and outcome effects. Beats, labels, titles and
 * facts are presentation; editing them never changes a replayed history.
 * Any change to this projection requires a new scene version.
 */
export function sceneContract(scene: Scene): string {
  return canonical({
    id: scene.id,
    version: scene.version,
    timelineId: scene.timelineId,
    input: inputContract(scene.input),
    variants: scene.variants?.map((variant) => ({
      id: variant.id,
      when: variant.when,
      input: inputContract(variant.input),
    })),
    outcomes: scene.outcomes.map((outcome) => ({
      when: outcome.when,
      effects: outcome.effects,
    })),
  });
}

export function contentContracts(content: Pick<Content, 'scenes'>) {
  return Object.fromEntries(
    content.scenes.map((scene) => [
      contractKey(scene.id, scene.version),
      sceneContract(scene),
    ]),
  );
}

/**
 * The registry is append-only: a registered scene version must keep its
 * contract forever, and every current scene version must be registered.
 */
export function registryDrift(
  registry: Record<string, string>,
  contents: Pick<Content, 'scenes'>[],
): { missing: string[]; changed: string[] } {
  const missing: string[] = [];
  const changed: string[] = [];
  for (const content of contents)
    for (const [key, contract] of Object.entries(contentContracts(content))) {
      if (!(key in registry)) missing.push(key);
      else if (registry[key] !== contract) changed.push(key);
    }
  return { missing, changed };
}

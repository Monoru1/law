import { it, expect } from 'vitest';
import { content } from '../../src/content';
import { sceneSchema } from '../../src/engine/schema';
it('validates all scene contracts and stable IDs', () => {
  expect(new Set(content.scenes.map((s) => s.id)).size).toBe(
    content.scenes.length,
  );
  content.scenes.forEach((scene) =>
    expect(sceneSchema.safeParse(scene).success).toBe(true),
  );
  expect(content.order).toHaveLength(8);
});

it('never models passive narrative progression as a one-option decision', () => {
  const passiveLabels =
    /^(afficher la suite|continuer|suivant|voir la suite)$/i;
  const passiveChoices = content.scenes.filter(
    (scene) =>
      scene.input.kind === 'choice' &&
      scene.input.options.length === 1 &&
      passiveLabels.test(scene.input.options[0]?.label.trim() ?? ''),
  );

  expect(passiveChoices.map((scene) => scene.id)).toEqual([]);
});

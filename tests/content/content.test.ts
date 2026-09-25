import {it,expect} from 'vitest';import {content} from '../../src/content';import {sceneSchema} from '../../src/engine/schema';
it('validates all scene contracts and stable IDs',()=>{expect(new Set(content.scenes.map(s=>s.id)).size).toBe(content.scenes.length);content.scenes.forEach(scene=>expect(sceneSchema.safeParse(scene).success).toBe(true));expect(content.order).toHaveLength(8)});

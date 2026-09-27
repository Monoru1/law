'use client';
import { contentT2 } from '../../content/t2';
import { t2FlowConfig } from '../../content/timelines/t2/meta';
import { useT2GameStore } from '../../store/gameStoreT2';
import { ScenePlayer } from './ScenePlayer';

export function ScenePlayerT2() {
  return (
    <ScenePlayer
      content={contentT2}
      useStore={useT2GameStore}
      flowConfig={t2FlowConfig}
    />
  );
}

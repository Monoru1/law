import type { Content } from '../engine';
import { principles } from './principles';
import { scenes } from './timelines/t2';
import { timeline } from './timelines/t2/meta';

export const contentT2: Content = {
  version: '1.0.0-t2',
  scenes,
  principles,
  observations: [],
  order: [...timeline.order],
};

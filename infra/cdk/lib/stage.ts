export type Stage = 'stage' | 'prod';

export const assertStage = (v: string | undefined): Stage => {
  if (v === 'stage' || v === 'prod') return v;
  throw new Error(`Invalid stage "${v}". Use stage | prod.`);
};
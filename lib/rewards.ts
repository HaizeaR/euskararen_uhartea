export type Reward = {
  id:    number;
  name:  string;   // in Basque
  image: string;
};

export const REWARDS: Reward[] = [
  { id: 0, name: 'Bateria',          image: '/rewards/reward-0.png' },
  { id: 1, name: 'Engranajea',       image: '/rewards/reward-1.png' },
  { id: 2, name: 'Giltza Inglesa',   image: '/rewards/reward-2.png' },
  { id: 3, name: 'Kable Bobina',     image: '/rewards/reward-3.png' },
  { id: 4, name: 'Motorra',          image: '/rewards/reward-4.png' },
  { id: 5, name: 'Zirkuitu Plaka',   image: '/rewards/reward-5.png' },
  { id: 6, name: 'Planoa',           image: '/rewards/reward-6.png' },
  { id: 7, name: 'Tresna Kutxa',     image: '/rewards/reward-7.png' },
];

/**
 * Returns 7 unique rewards for a group, shuffled deterministically
 * from the group ID — every group gets a different set.
 * Index 0  = initial/welcome reward (Hasierako Hondartza, always unlocked)
 * Index 1–6 = CHECKPOINTS[1..6] rewards
 */
export function getGroupRewards(groupId: number): Reward[] {
  const indices = [0, 1, 2, 3, 4, 5, 6, 7];
  // Knuth multiplicative hash as simple seed
  let seed = Math.abs(groupId * 2654435761) >>> 0;
  for (let i = indices.length - 1; i > 0; i--) {
    seed = (Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0);
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 7).map(i => REWARDS[i]);
}

/**
 * Get the reward for a specific checkpoint (id 0–6) for a given group.
 * Checkpoint 0 = initial welcome reward (always unlocked).
 */
export function getRewardForCheckpoint(checkpointId: number, groupId: number): Reward | null {
  if (checkpointId < 0) return null;
  return getGroupRewards(groupId)[checkpointId] ?? null;
}

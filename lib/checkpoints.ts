export type Checkpoint = {
  id: number;
  name: string;
  icon: string;
  reward: string;
  requiredPos: number;   // 0–50
  x: number;            // relative to map image width (0–1)
  y: number;            // relative to map image height (0–1)
  description: string;
};

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 0,
    name: 'Hasierako Hondartza',
    icon: '🏖️',
    reward: '🐚',
    requiredPos: 0,
    x: 0.165, y: 0.800,
    description:
      'Bidaiaren hasiera! Uharte honen hondartza eder honetan, itsasoak historia zaharrak kontatzen ditu. Lehen pausoa eman duzu — aurrera!',
  },
  {
    id: 1,
    name: 'Erromaren Kanpalekua',
    icon: '⚔️',
    reward: '🦅',
    requiredPos: 9,
    x: 0.415, y: 0.730,
    description:
      'Erromako soldaduak duela 2000 urte hemen kanpatu ziren. Diziplina eta ahaleginak bide luzeak egiten uzten du. Legioaren gogoa lortu duzu!',
  },
  {
    id: 2,
    name: 'Azteken Tenplua',
    icon: '🏛️',
    reward: '☀️',
    requiredPos: 18,
    x: 0.730, y: 0.830,
    description:
      'Azteken zibilizazio handiak piramide izugarri hau eraiki zuen eguzki jainkoaren omenez. Jakinduria eta indarra uztartzean datza haien sekretua.',
  },
  {
    id: 3,
    name: 'Sumendiaren Bidea',
    icon: '🌋',
    reward: '🔥',
    requiredPos: 27,
    x: 0.810, y: 0.530,
    description:
      'Sumendiaren aldapa gorrian gora igo behar duzu. Ausartak bakarrik iristen dira hona — beldurra gainditzea da erronkarik handiena.',
  },
  {
    id: 4,
    name: 'Erdi Aroko Gaztelua',
    icon: '🏰',
    reward: '👑',
    requiredPos: 36,
    x: 0.570, y: 0.275,
    description:
      'Zaldun nobleak eta erregeak hemen bizi ziren. Errespetua eta taldekidetasuna ziren gazteluaren oinarri sendoenak. Ohore guztia zuretzat!',
  },
  {
    id: 5,
    name: 'Palmondoen Harana',
    icon: '🌴',
    reward: '🦉',
    requiredPos: 43,
    x: 0.225, y: 0.360,
    description:
      'Haran lasai honetan Grezia zaharreko jakintsuak filosofia eta hizkuntza lantzen zituzten. Jakinduria eguneroko ahaleginen emaitza da.',
  },
  {
    id: 6,
    name: 'Denbora Ontzia',
    icon: '⚙️',
    reward: '🏆',
    requiredPos: 50,
    x: 0.875, y: 0.130,
    description:
      'Zorionak! Bidaiaren amaierara iritsi zara! Denbora Ontzian denboran zehar bidaia dezakezu — historian ikasitako guztia erabiliz. Benetan itzela!',
  },
];

/** Get the (x,y) on the path for a given position 0–50 */
export function getPathPosition(position: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(position, 50));
  const last    = CHECKPOINTS.length - 1;

  for (let i = 0; i < last; i++) {
    const a = CHECKPOINTS[i];
    const b = CHECKPOINTS[i + 1];
    if (clamped >= a.requiredPos && clamped <= b.requiredPos) {
      const span = b.requiredPos - a.requiredPos;
      const t    = span === 0 ? 0 : (clamped - a.requiredPos) / span;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  const last_cp = CHECKPOINTS[last];
  return { x: last_cp.x, y: last_cp.y };
}

/** Which checkpoints has a group with given position unlocked? */
export function unlockedCheckpoints(position: number): number[] {
  return CHECKPOINTS.filter(c => position >= c.requiredPos).map(c => c.id);
}

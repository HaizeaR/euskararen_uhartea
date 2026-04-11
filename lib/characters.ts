export const CHARACTERS = [
  {
    index: 0,
    name:  'Pirata',
    label: 'Berdea',
    color: '#27ae60',
    image: '/characters/char-0.png',
  },
  {
    index: 1,
    name:  'Gudaria',
    label: 'Gorria',
    color: '#e74c3c',
    image: '/characters/char-1.png',
  },
  {
    index: 2,
    name:  'Sukaldaria',
    label: 'Laranja',
    color: '#e67e22',
    image: '/characters/char-2.png',
  },
  {
    index: 3,
    name:  'Eraikitzailea',
    label: 'Arrosa',
    color: '#d63384',
    image: '/characters/char-3.png',
  },
  {
    index: 4,
    name:  'Esploratzailea',
    label: 'Urdina',
    color: '#2980b9',
    image: '/characters/char-4.png',
  },
] as const;

export const CHARACTER_NAMES  = CHARACTERS.map(c => c.name);
export const CHARACTER_COLORS = CHARACTERS.map(c => c.color);
export const CHARACTER_IMAGES = CHARACTERS.map(c => c.image);
// Kept for MapCanvas fallback while images load
export const CHARACTER_ICONS  = ['🏴‍☠️', '⚔️', '🍳', '🔧', '🔦'];

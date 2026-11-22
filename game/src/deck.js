// Rune Tide — deck.js: the card pool, the four elements and deck building.
// Every card is original to this game: its own names, art (colour + shape) and text.
export const ELEMENTS = {
  ember: { name: 'Ember', glyph: '▲', colour: '#e5484d', dark: '#7a1d20', light: '#ffd9d6' },
  tide: { name: 'Tide', glyph: '●', colour: '#2f7fe0', dark: '#123a6e', light: '#d3e7ff' },
  thorn: { name: 'Thorn', glyph: '◆', colour: '#2fae5f', dark: '#0f5c2e', light: '#d2f2dd' },
  gloom: { name: 'Gloom', glyph: '☾', colour: '#8b5cf6', dark: '#3b2373', light: '#e6dcff' },
};
export const ELEMENT_KEYS = Object.keys(ELEMENTS);

// A seeded RNG (mulberry32) so screenshot scenes and replays are deterministic.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(array, rng) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let nextUid = 1;
// type: 'creature' | 'spell'. Spells carry a `spell` key naming their effect in rules.js.
export const CARD_POOL = [
  // Ember creatures — fast, hard-hitting.
  { id: 'spark-sprite', name: 'Spark Sprite', element: 'ember', type: 'creature', cost: 1, attack: 1, health: 2, text: 'A flicker that bites.' },
  { id: 'cinder-imp', name: 'Cinder Imp', element: 'ember', type: 'creature', cost: 1, attack: 2, health: 1, text: 'Burns bright, burns out.' },
  { id: 'flame-hound', name: 'Flame Hound', element: 'ember', type: 'creature', cost: 2, attack: 3, health: 2, text: 'Its bark is a backdraft.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', element: 'ember', type: 'creature', cost: 5, attack: 6, health: 5, text: 'Rises from its own embers.' },
  // Tide creatures — swell with the shared tide meter.
  { id: 'dew-wisp', name: 'Dew Wisp', element: 'tide', type: 'creature', cost: 1, attack: 1, health: 2, text: 'Rides the morning tide.' },
  { id: 'coral-guard', name: 'Coral Guard', element: 'tide', type: 'creature', cost: 2, attack: 2, health: 4, text: 'A wall that grew in the sea.' },
  { id: 'river-serpent', name: 'River Serpent', element: 'tide', type: 'creature', cost: 3, attack: 4, health: 3, text: 'The current, given teeth.' },
  { id: 'tide-leviathan', name: 'Tide Leviathan', element: 'tide', type: 'creature', cost: 6, attack: 7, health: 6, text: 'The whole ocean, angry.' },
  // Thorn creatures — sturdy, tangled.
  { id: 'seedling', name: 'Seedling', element: 'thorn', type: 'creature', cost: 1, attack: 1, health: 1, text: 'Small. Patient. Everywhere.' },
  { id: 'bramble-sprout', name: 'Bramble Sprout', element: 'thorn', type: 'creature', cost: 1, attack: 2, health: 2, text: 'Mind the thorns.' },
  { id: 'vine-wolf', name: 'Vine Wolf', element: 'thorn', type: 'creature', cost: 3, attack: 3, health: 3, text: 'It hunts in a pack of one.' },
  { id: 'thorn-ancient', name: 'Thorn Ancient', element: 'thorn', type: 'creature', cost: 5, attack: 5, health: 6, text: 'Older than the forest floor.' },
  // Gloom creatures — evasive, draining.
  { id: 'gloom-moth', name: 'Gloom Moth', element: 'gloom', type: 'creature', cost: 1, attack: 1, health: 2, text: 'Drawn to dying light.' },
  { id: 'shade-bat', name: 'Shade Bat', element: 'gloom', type: 'creature', cost: 1, attack: 2, health: 1, text: 'You hear it after it bites.' },
  { id: 'hollow-wraith', name: 'Hollow Wraith', element: 'gloom', type: 'creature', cost: 3, attack: 4, health: 2, text: 'It remembers being alive.' },
  { id: 'nightmare', name: 'Nightmare', element: 'gloom', type: 'creature', cost: 6, attack: 6, health: 5, text: 'Do not sleep on this one.' },
  // Spells — one per element, each answering a different threat.
  { id: 'ember-burst', name: 'Ember Burst', element: 'ember', type: 'spell', cost: 2, spell: 'burst', text: 'Deal 3 damage to any target.' },
  { id: 'ember-nova', name: 'Ember Nova', element: 'ember', type: 'spell', cost: 4, spell: 'nova', text: 'Deal 2 damage to all enemy creatures.' },
  { id: 'tide-surge', name: 'Tide Surge', element: 'tide', type: 'spell', cost: 2, spell: 'surge', text: 'Draw 2 cards. Raise the tide by 1.' },
  { id: 'stillwater', name: 'Stillwater', element: 'tide', type: 'spell', cost: 3, spell: 'still', text: 'Enemy creatures cannot attack next turn.' },
  { id: 'thorn-snare', name: 'Thorn Snare', element: 'thorn', type: 'spell', cost: 2, spell: 'snare', text: 'Deal 2 to a creature. Heal 2 life.' },
  { id: 'rootward', name: 'Rootward', element: 'thorn', type: 'spell', cost: 2, spell: 'ward', text: 'Heal 5 life.' },
  { id: 'gloom-veil', name: 'Gloom Veil', element: 'gloom', type: 'spell', cost: 1, spell: 'veil', text: 'Block the next damage to you.' },
  { id: 'soul-siphon', name: 'Soul Siphon', element: 'gloom', type: 'spell', cost: 3, spell: 'siphon', text: 'Deal 2 to the enemy hero. Heal 2 life.' },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

export function makeCard(def) {
  return {
    uid: nextUid++,
    id: def.id,
    name: def.name,
    element: def.element,
    type: def.type,
    cost: def.cost,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    spell: def.spell ?? null,
    text: def.text,
    canAttack: false,
    bonusAttack: 0,
  };
}

// A 30-card deck: two copies of every pool card, shuffled with the given seed,
// then the top 30 taken — every element and spell stays in the mix.
export function buildDeck(seed) {
  const rng = makeRng(seed);
  const defs = [];
  for (const def of CARD_POOL) defs.push(def, def);
  return shuffle(defs, rng).slice(0, 30).map(makeCard);
}

export function drawCards(deck, hand, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (deck.length === 0) break;
    const card = deck.pop();
    if (hand.length < 10) { hand.push(card); drawn.push(card); }
  }
  return drawn;
}

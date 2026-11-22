// Rune Tide — shots.js: deterministic screenshot scenes for ?shot=title|table|win|loss.
// Each scene is built from the real rules (newGame, makeCard) with a fixed seed,
// so a screenshot is a genuine render of the game's own code, never a mock.
import { newGame } from './rules.js';
import { makeCard, cardById } from './deck.js';
import { planIntent } from './ai.js';

function place(state, side, ids, onBoard) {
  const cards = ids.map((id) => makeCard(cardById(id)));
  if (onBoard) {
    for (const c of cards) { c.canAttack = true; side.board.push(c); }
  } else {
    side.hand.push(...cards);
  }
  return cards;
}

export function buildShotState(kind) {
  if (kind === 'title') {
    return newGame(20261123); // screen is 'title' by default
  }
  if (kind === 'win') {
    const s = newGame(20261123);
    s.screen = 'win'; s.winner = 'player';
    s.player.life = 14; s.ai.life = 0; s.turn = 9;
    return s;
  }
  if (kind === 'loss') {
    const s = newGame(20261123);
    s.screen = 'loss'; s.winner = 'ai';
    s.player.life = 0; s.ai.life = 11; s.turn = 8;
    return s;
  }
  // 'table': a rich mid-game frame — both boards populated, full hands, tide high,
  // life totals dented, mana mid-turn, and the Warden's intent declared.
  const s = newGame(20261123);
  s.screen = 'play';
  s.active = 'player';
  s.turn = 6;
  s.tide = 3;
  s.player.life = 18; s.player.mana = 7;
  s.ai.life = 22; s.ai.mana = 6;
  s.player.hand = []; s.ai.hand = [];
  s.player.board = []; s.ai.board = [];
  place(s, s.player, ['flame-hound', 'coral-guard'], true);
  place(s, s.ai, ['vine-wolf', 'hollow-wraith', 'dew-wisp'], true);
  place(s, s.player, ['ash-phoenix', 'ember-burst', 'tide-surge', 'thorn-snare', 'gloom-veil', 'river-serpent', 'bramble-sprout'], false);
  place(s, s.ai, ['x', 'x', 'x', 'x', 'x'].map(() => 'seedling'), false);
  s.player.playedElements = ['ember'];
  s.log = [
    'Vine Wolf attacks Coral Guard for 3.',
    'You summoned Flame Hound (Ember, +1 synergy).',
    'Rune Warden summoned Hollow Wraith.',
    'The tide rises to 3 — Tide cards gain +1 attack.',
    'You cast Tide Surge and drew 2 cards.',
  ];
  s.intent = planIntent(s);
  return s;
}

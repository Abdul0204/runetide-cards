// Rune Tide — rules.js: turn, mana, combat and the two combinable mechanics.
// Mechanics: (1) element synergy — the second card of an element played in one turn
// gets +1 attack (creature) or +1 effect (spell); (2) the shared tide meter rises
// every turn and boosts Tide creatures while it is high; (3) spells counter the AI's
// declared intent (see ai.js), so reading the intent banner is a real decision.
import { buildDeck, drawCards, ELEMENTS } from './deck.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_TIDE = 5;
export const HAND_LIMIT = 10;
export const BOARD_LIMIT = 7;

export function newGame(seed = 20261123) {
  const state = {
    seed,
    screen: 'title', // title | play | win | loss
    turn: 1,
    tide: 1,
    active: 'player', // whose turn it is
    log: ['The tide is rising. Rune Tide begins — first to 0 life loses.'],
    intent: null, // the AI's declared plan for its next turn, shown to the player
    winner: null,
    player: newSide(buildDeck(seed), 'You'),
    ai: newSide(buildDeck(seed + 77), 'Rune Warden'),
  };
  drawCards(state.player.deck, state.player.hand, 4);
  drawCards(state.ai.deck, state.ai.hand, 4);
  state.player.mana = 3;
  state.ai.mana = 3;
  return state;
}

function newSide(deck, label) {
  return {
    label, life: MAX_LIFE, mana: 0, maxMana: MAX_MANA,
    deck, hand: [], board: [],
    playedElements: [], // elements played this turn, for the synergy bonus
    veiled: false, // Gloom Veil: block the next damage to this hero
    frozen: false, // Stillwater: creatures cannot attack this turn
    fatigue: 0,
  };
}

export function tideBonus(state, card) {
  // Tide creatures gain +1 attack once the tide reaches 3, +2 at the full tide of 5.
  if (card.element !== 'tide') return 0;
  if (state.tide >= 5) return 2;
  if (state.tide >= 3) return 1;
  return 0;
}

export function effectiveAttack(state, card) {
  return card.attack + (card.bonusAttack || 0) + tideBonus(state, card);
}

// The synergy bonus: the second (or later) card of an element in one turn.
export function synergyBonus(side, card) {
  return side.playedElements.includes(card.element) ? 1 : 0;
}

export function canPlay(state, side, card) {
  if (state.screen !== 'play') return false;
  if (state.active !== (side === state.player ? 'player' : 'ai')) return false;
  if (card.type === 'creature' && side.board.length >= BOARD_LIMIT) return false;
  return side.mana >= card.cost;
}

export function playCard(state, side, card) {
  const idx = side.hand.indexOf(card);
  if (idx < 0 || !canPlay(state, side, card)) return null;
  side.hand.splice(idx, 1);
  side.mana -= card.cost;
  const bonus = synergyBonus(side, card);
  side.playedElements.push(card.element);
  if (card.type === 'creature') {
    card.bonusAttack = bonus;
    card.canAttack = false; // creatures wait a turn before they can strike
    side.board.push(card);
    log(state, `${side.label} summoned ${card.name} (${ELEMENTS[card.element].name}${bonus ? ', +1 synergy' : ''}).`);
    return { kind: 'creature', card };
  }
  const result = castSpell(state, side, card, bonus);
  log(state, `${side.label} cast ${card.name}${bonus ? ' (+1 synergy)' : ''}.`);
  return result;
}

function otherSide(state, side) {
  return side === state.player ? state.ai : state.player;
}

function castSpell(state, side, card, bonus) {
  const foe = otherSide(state, side);
  switch (card.spell) {
    case 'burst': return { kind: 'spell', spell: 'burst', amount: 3 + bonus, needsTarget: true };
    case 'nova': {
      const dmg = 2 + bonus;
      damageBoard(state, foe, dmg);
      return { kind: 'spell', spell: 'nova', amount: dmg };
    }
    case 'surge': {
      drawCards(side.deck, side.hand, 2 + bonus);
      state.tide = Math.min(MAX_TIDE, state.tide + 1);
      return { kind: 'spell', spell: 'surge', amount: 2 + bonus };
    }
    case 'still': foe.frozen = true; return { kind: 'spell', spell: 'still' };
    case 'snare': return { kind: 'spell', spell: 'snare', amount: 2 + bonus, needsTarget: true, heal: 2 + bonus };
    case 'ward': healSide(side, 5 + bonus); return { kind: 'spell', spell: 'ward', amount: 5 + bonus };
    case 'veil': side.veiled = true; return { kind: 'spell', spell: 'veil' };
    case 'siphon': damageHero(state, foe, 2 + bonus); healSide(side, 2 + bonus); return { kind: 'spell', spell: 'siphon', amount: 2 + bonus };
    default: return { kind: 'spell', spell: card.spell };
  }
}

// Targeted spells resolve here: target is a creature card, or 'hero' for the enemy hero.
export function resolveTargetedSpell(state, side, card, effect, target) {
  const foe = otherSide(state, side);
  if (effect.spell === 'burst') {
    if (target === 'hero') damageHero(state, foe, effect.amount);
    else damageCreature(state, foe, target, effect.amount);
  } else if (effect.spell === 'snare') {
    if (target && target !== 'hero') damageCreature(state, foe, target, effect.amount);
    healSide(side, effect.heal);
  }
  checkEnd(state);
}

export function damageHero(state, side, amount) {
  if (amount <= 0) return 0;
  if (side.veiled) {
    side.veiled = false;
    log(state, `${side.label}'s Gloom Veil swallowed the blow.`);
    return 0;
  }
  side.life = Math.max(0, side.life - amount);
  log(state, `${side.label} takes ${amount} damage.`);
  checkEnd(state);
  return amount;
}

export function damageCreature(state, side, creature, amount) {
  creature.health -= amount;
  log(state, `${creature.name} takes ${amount} damage.`);
  if (creature.health <= 0) {
    const i = side.board.indexOf(creature);
    if (i >= 0) side.board.splice(i, 1);
    log(state, `${creature.name} is destroyed.`);
  }
}

function damageBoard(state, side, amount) {
  for (const c of side.board.slice()) damageCreature(state, side, c, amount);
}

export function healSide(side, amount) {
  side.life = Math.min(MAX_LIFE, side.life + amount);
}

export function canAttack(state, side, creature) {
  if (state.screen !== 'play') return false;
  if (state.active !== (side === state.player ? 'player' : 'ai')) return false;
  if (!creature.canAttack || side.frozen) return false;
  return side.board.includes(creature);
}

// Attack a creature, or 'hero' to strike the enemy hero directly.
export function attack(state, side, creature, target) {
  if (!canAttack(state, side, creature)) return false;
  const foe = otherSide(state, side);
  creature.canAttack = false;
  const atk = effectiveAttack(state, creature);
  if (target === 'hero') {
    log(state, `${creature.name} strikes ${foe.label} for ${atk}.`);
    damageHero(state, foe, atk);
  } else {
    log(state, `${creature.name} attacks ${target.name} for ${atk}.`);
    damageCreature(state, foe, target, atk);
    damageCreature(state, side, creature, target.attack + (target.bonusAttack || 0) + tideBonus(state, target));
  }
  checkEnd(state);
  return true;
}

export function startTurn(state, side) {
  state.active = side === state.player ? 'player' : 'ai';
  side.playedElements = [];
  side.mana = Math.min(MAX_MANA, 3 + Math.floor(state.turn / 2));
  for (const c of side.board) c.canAttack = true;
  drawCards(side.deck, side.hand, 1);
  if (side.deck.length === 0) {
    side.fatigue += 1;
    damageHero(state, side, side.fatigue);
    log(state, `${side.label} draws from an empty deck — fatigue ${side.fatigue}.`);
  }
}

export function endTurn(state) {
  if (state.screen !== 'play') return;
  const side = state.active === 'player' ? state.player : state.ai;
  side.frozen = false;
  if (state.active === 'player') {
    state.turn += 1;
    state.tide = Math.min(MAX_TIDE, state.tide + 1);
    startTurn(state, state.ai);
  } else {
    state.turn += 1;
    state.tide = Math.min(MAX_TIDE, state.tide + 1);
    startTurn(state, state.player);
  }
  checkEnd(state);
}

export function checkEnd(state) {
  if (state.winner) return;
  if (state.ai.life <= 0) { state.winner = 'player'; state.screen = 'win'; }
  else if (state.player.life <= 0) { state.winner = 'ai'; state.screen = 'loss'; }
}

export function log(state, message) {
  state.log.unshift(message);
  if (state.log.length > 8) state.log.length = 8;
}

export function startGame(state) {
  state.screen = 'play';
  state.active = 'player';
  startTurn(state, state.player);
}

// Rune Tide — ai.js: the Rune Warden's brain and its declared intent.
// The AI plans its next turn in the open: planIntent() returns a plain-language
// line the table shows before the player's turn ends, so the player can read it
// and counter it (Stillwater, Gloom Veil, Ember Burst on the named creature).
import { canPlay, effectiveAttack, playCard, attack, resolveTargetedSpell } from './rules.js';
import { ELEMENTS } from './deck.js';

function describeCard(card) {
  return `${card.name} (${ELEMENTS[card.element].name} ${card.cost})`;
}

// Pick the AI's plan for its coming turn from its hand and board, without acting yet.
export function planIntent(state) {
  const ai = state.ai;
  const mana = ai.mana;
  const playable = ai.hand.filter((c) => c.cost <= mana);
  const creature = playable.find((c) => c.type === 'creature');
  const spell = playable.find((c) => c.type === 'spell');
  const attacker = ai.board.find((c) => c.canAttack && !ai.frozen);
  const parts = [];
  if (creature) parts.push(`play ${describeCard(creature)}`);
  else if (spell) parts.push(`cast ${describeCard(spell)}`);
  if (attacker) {
    const target = state.player.board.length > 0 ? state.player.board[0] : null;
    parts.push(target ? `attack your ${target.name} with ${attacker.name}` : `strike you with ${attacker.name} for ${effectiveAttack(state, attacker)}`);
  }
  if (parts.length === 0) parts.push('pass and draw');
  return `Rune Warden intends to ${parts.join(', then ')}.`;
}

// Execute one AI turn: play creatures greedily (biggest first), cast a useful spell,
// then attack with everything ready. Returns a list of what happened, for the log.
export function takeAiTurn(state) {
  const ai = state.ai;
  const done = [];
  // Creatures first, most expensive first, while mana allows.
  const creatures = ai.hand.filter((c) => c.type === 'creature').sort((a, b) => b.cost - a.cost);
  for (const card of creatures) {
    if (canPlay(state, ai, card)) {
      playCard(state, ai, card);
      done.push(`played ${card.name}`);
    }
  }
  // One spell if it helps: burst at the player's biggest creature, nova when outnumbered.
  for (const card of ai.hand.filter((c) => c.type === 'spell')) {
    if (!canPlay(state, ai, card)) continue;
    if (card.spell === 'burst' && state.player.board.length > 0) {
      const target = state.player.board.slice().sort((a, b) => b.attack - a.attack)[0];
      const effect = playCard(state, ai, card);
      if (effect) { resolveTargetedSpell(state, ai, card, effect, target); done.push(`burst ${target.name}`); }
      break;
    }
    if (card.spell === 'nova' && state.player.board.length >= 2) {
      playCard(state, ai, card); done.push('cast Ember Nova'); break;
    }
    if (card.spell === 'surge' && ai.hand.length <= 3) {
      playCard(state, ai, card); done.push('cast Tide Surge'); break;
    }
    if (card.spell === 'ward' && ai.life <= 20) {
      playCard(state, ai, card); done.push('cast Rootward'); break;
    }
    if (card.spell === 'siphon') {
      playCard(state, ai, card); done.push('cast Soul Siphon'); break;
    }
    if (card.spell === 'still' && state.player.board.some((c) => c.canAttack)) {
      playCard(state, ai, card); done.push('cast Stillwater'); break;
    }
  }
  // Attack: hit the player's biggest creature when it can kill it, else go for the hero.
  for (const creature of ai.board.slice()) {
    if (state.screen !== 'play') break;
    const foe = state.player.board.slice().sort((a, b) => b.attack - a.attack)[0];
    const target = foe && effectiveAttack(state, creature) >= foe.health ? foe : 'hero';
    if (attack(state, ai, creature, target)) done.push(`attacked with ${creature.name}`);
  }
  return done;
}

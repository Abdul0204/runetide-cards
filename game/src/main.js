// Rune Tide — main.js: the game loop, input and the ?shot= scene mode.
// Wires the rules, the AI and the renderer together; nothing here knows how a
// card looks (render.js) or what a card does (rules.js).
import { newGame, startGame, playCard, attack, endTurn, resolveTargetedSpell, checkEnd } from './rules.js';
import { planIntent, takeAiTurn } from './ai.js';
import { render } from './render.js';
import { buildShotState } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 20261123) || 20261123;

let state = shot ? buildShotState(shot) : newGame(seed);
const ui = { selectedCard: null, selectedAttacker: null, pendingSpell: null, hint: '' };

function refresh() {
  render(state, ui);
  wireButtons();
}

function wireButtons() {
  const start = document.getElementById('start-btn');
  if (start) start.addEventListener('click', () => {
    startGame(state);
    state.intent = planIntent(state);
    ui.hint = '';
    refresh();
  });
  const again = document.getElementById('again-btn');
  if (again) again.addEventListener('click', () => {
    state = newGame(seed + Math.floor(Math.random() * 1000));
    ui.selectedCard = null; ui.selectedAttacker = null; ui.pendingSpell = null;
    refresh();
  });
  const end = document.getElementById('end-turn');
  if (end) end.addEventListener('click', () => doEndTurn());
}

function clearSelection() {
  ui.selectedCard = null; ui.selectedAttacker = null; ui.pendingSpell = null;
}

function doEndTurn() {
  if (state.screen !== 'play' || state.active !== 'player') return;
  clearSelection();
  endTurn(state); // switches to the Warden
  refresh();
  if (state.screen !== 'play') return;
  // The Warden plays after a beat, so its moves read as a turn, not a flash.
  setTimeout(() => {
    takeAiTurn(state);
    if (state.screen === 'play') {
      endTurn(state); // back to the player
      state.intent = planIntent(state);
    }
    refresh();
  }, 650);
}

function heroOf(uid) {
  for (const side of [state.player, state.ai]) {
    for (const c of side.board) if (c.uid === uid) return { side, card: c };
    for (const c of side.hand) if (c.uid === uid) return { side, card: c };
  }
  return null;
}

function onCardClick(uid) {
  if (state.screen !== 'play' || state.active !== 'player') return;
  const found = heroOf(uid);
  if (!found) return;
  const { side, card } = found;

  // Clicking an enemy creature: it is the target of a pending attack or spell.
  if (side === state.ai) {
    if (ui.pendingSpell) {
      resolveTargetedSpell(state, state.player, ui.pendingSpell.card, ui.pendingSpell.effect, card);
      clearSelection(); refresh(); return;
    }
    if (ui.selectedAttacker) {
      const attacker = state.player.board.find((c) => c.uid === ui.selectedAttacker);
      if (attacker && attack(state, state.player, attacker, card)) { clearSelection(); refresh(); }
      return;
    }
  }
  // Clicking one of your own board creatures: arm it to attack.
  if (side === state.player && state.player.board.includes(card)) {
    ui.selectedAttacker = ui.selectedAttacker === card.uid ? null : card.uid;
    ui.selectedCard = null; ui.pendingSpell = null;
    ui.hint = ui.selectedAttacker ? `${card.name} is ready — click an enemy creature or the Warden to attack.` : '';
    refresh(); return;
  }
  // Clicking a hand card: play it (creature) or arm its targeting (targeted spell).
  if (side === state.player && state.player.hand.includes(card)) {
    if (state.player.mana < card.cost) { ui.hint = `Not enough mana for ${card.name} (${card.cost} needed).`; refresh(); return; }
    if (card.type === 'creature') {
      if (state.player.board.length >= 7) { ui.hint = 'Your board is full.'; refresh(); return; }
      playCard(state, state.player, card);
      clearSelection(); refresh(); return;
    }
    const effect = playCard(state, state.player, card);
    if (!effect) { refresh(); return; }
    if (effect.needsTarget) {
      ui.pendingSpell = { card, effect };
      ui.hint = `${card.name}: click an enemy creature (or the Warden's portrait) to target it. Esc cancels.`;
      refresh(); return;
    }
    clearSelection(); refresh();
  }
}

function onHeroClick(which) {
  if (state.screen !== 'play' || state.active !== 'player') return;
  if (which === 'ai') {
    if (ui.pendingSpell) {
      resolveTargetedSpell(state, state.player, ui.pendingSpell.card, ui.pendingSpell.effect, 'hero');
      clearSelection(); refresh(); return;
    }
    if (ui.selectedAttacker) {
      const attacker = state.player.board.find((c) => c.uid === ui.selectedAttacker);
      if (attacker && attack(state, state.player, attacker, 'hero')) { clearSelection(); refresh(); }
    }
  }
}

document.addEventListener('click', (event) => {
  const cardEl = event.target.closest('.card[data-uid]');
  if (cardEl) { onCardClick(Number(cardEl.dataset.uid)); return; }
  const heroEl = event.target.closest('.hero[data-hero]');
  if (heroEl) { onHeroClick(heroEl.dataset.hero); }
});

document.addEventListener('keydown', (event) => {
  if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    document.getElementById('start-btn')?.click(); return;
  }
  if ((state.screen === 'win' || state.screen === 'loss') && event.key === 'Enter') {
    document.getElementById('again-btn')?.click(); return;
  }
  if (state.screen !== 'play') return;
  if (event.key === 'Escape') { clearSelection(); ui.hint = ''; refresh(); return; }
  if (event.key === 'Enter' && state.active === 'player') { doEndTurn(); return; }
  const n = Number(event.key);
  if (n >= 1 && n <= 9 && state.active === 'player') {
    const card = state.player.hand[n - 1];
    if (card) onCardClick(card.uid);
  }
});

refresh();

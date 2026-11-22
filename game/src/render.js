// Rune Tide — render.js: every pixel the player sees, as DOM.
// Elements are told apart by colour AND shape/symbol, never by text alone:
// Ember ▲ red, Tide ● blue, Thorn ◆ green, Gloom ☾ purple.
import { ELEMENTS } from './deck.js';
import { effectiveAttack, tideBonus } from './rules.js';

function el(card) { return ELEMENTS[card.element]; }

export function cardHtml(state, card, opts = {}) {
  const e = el(card);
  const atk = card.type === 'creature' ? effectiveAttack(state, card) : '✦';
  const hp = card.type === 'creature' ? card.health : '—';
  const playable = opts.playable ? ' playable' : '';
  const selected = opts.selected ? ' selected' : '';
  const tired = card.type === 'creature' && !card.canAttack && opts.onBoard ? ' tired' : '';
  const synergy = opts.synergy ? `<span class="synergy">+1 SYNERGY</span>` : '';
  const stats = card.type === 'creature'
    ? `<div class="card-stats"><span class="atk">${atk}</span><span class="hp">${hp}</span></div>`
    : '';
  const elLine = card.type === 'spell' ? `${e.name} · Spell` : e.name;
  return `<div class="card el-${card.element}${playable}${selected}${tired}" data-uid="${card.uid}" style="--el:${e.colour};--el-dark:${e.dark};--el-light:${e.light};--i:${opts.index ?? 0}">
    <div class="card-cost">${card.cost}</div>
    <div class="card-glyph">${e.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-el">${elLine}</div>
    <div class="card-art">${e.glyph}</div>
    <div class="card-text">${card.text}</div>
    ${stats}
    ${synergy}
  </div>`;
}

function backHtml(count) {
  let backs = '';
  for (let i = 0; i < count; i += 1) {
    backs += `<div class="card back" style="--i:${i}"><div class="card-back-glyph">~</div></div>`;
  }
  return backs;
}

function lifeBar(life) {
  const pct = Math.max(0, Math.min(100, (life / 30) * 100));
  return `<div class="lifebar"><div class="lifefill" style="width:${pct}%"></div><span class="lifenumber">${life} ❤</span></div>`;
}

function manaGems(mana) {
  let gems = '';
  for (let i = 0; i < 10; i += 1) gems += `<span class="gem${i < mana ? ' on' : ''}">◆</span>`;
  return `<div class="mana" title="Mana ${mana}/10">${gems}<span class="mananumber">${mana}/10</span></div>`;
}

function tideHtml(tide) {
  let pips = '';
  for (let i = 1; i <= 5; i += 1) pips += `<span class="tidepip${i <= tide ? ' on' : ''}">●</span>`;
  return `<div class="tide" title="Shared tide meter — Tide cards gain +1 attack at tide 3, +2 at tide 5">TIDE ${pips} <b>${tide}/5</b></div>`;
}

function heroHtml(state, side, isPlayer, ui) {
  const frozen = side.frozen ? '<span class="tag frozen">FROZEN</span>' : '';
  const veiled = side.veiled ? '<span class="tag veiled">VEILED</span>' : '';
  return `<div class="hero ${isPlayer ? 'hero-you' : 'hero-foe'}" data-hero="${isPlayer ? 'player' : 'ai'}">
    <div class="hero-name">${side.label} ${frozen}${veiled}</div>
    ${lifeBar(side.life)}
    ${manaGems(side.mana)}
  </div>`;
}

export function render(state, ui) {
  const root = document.getElementById('app');
  if (state.screen === 'title') { root.innerHTML = titleHtml(); return; }
  if (state.screen === 'win') { root.innerHTML = endHtml(state, true); return; }
  if (state.screen === 'loss') { root.innerHTML = endHtml(state, false); return; }

  const p = state.player;
  const ai = state.ai;
  const myTurn = state.active === 'player';
  const hand = p.hand.map((card, i) => cardHtml(state, card, {
    index: i,
    playable: myTurn && p.mana >= card.cost && !(card.type === 'creature' && p.board.length >= 7),
    selected: ui.selectedCard === card.uid,
    synergy: p.playedElements.includes(card.element),
  })).join('');
  const board = p.board.map((card, i) => cardHtml(state, card, {
    index: i, onBoard: true, selected: ui.selectedAttacker === card.uid,
  })).join('');
  const aiBoard = ai.board.map((card, i) => cardHtml(state, card, { index: i, onBoard: true })).join('');

  root.innerHTML = `
  <header class="topbar">
    <div class="brand">RUNE TIDE</div>
    ${tideHtml(state.tide)}
    <div class="turn">TURN ${state.turn} · ${myTurn ? 'YOUR TURN' : 'WARDEN’S TURN'}</div>
  </header>
  ${state.intent && myTurn ? `<div class="intent">🔮 ${state.intent}</div>` : ''}
  <section class="zone foe-zone">
    ${heroHtml(state, ai, false, ui)}
    <div class="hand-mini">${backHtml(ai.hand.length)}</div>
    <div class="board">${aiBoard || '<div class="board-empty">No creatures yet</div>'}</div>
  </section>
  <section class="midrow">
    <div class="log">${state.log.map((m) => `<div>${m}</div>`).join('')}</div>
    <button id="end-turn" class="endturn" ${myTurn ? '' : 'disabled'}>${myTurn ? 'END TURN ⏎' : 'WARDEN THINKING…'}</button>
  </section>
  <section class="zone you-zone">
    <div class="board">${board || '<div class="board-empty">Your creatures will stand here</div>'}</div>
    ${heroHtml(state, p, true, ui)}
    <div class="hand">${hand}</div>
    <div class="hint">${ui.hint || 'Click a card to play it · click one of your creatures, then an enemy, to attack · keys 1–9 play cards, Enter ends turn'}</div>
  </section>`;
}

function titleHtml() {
  return `<div class="title-screen">
    <div class="title-runes"><span class="rune e1">▲</span><span class="rune e2">●</span><span class="rune e3">◆</span><span class="rune e4">☾</span></div>
    <h1>RUNE TIDE</h1>
    <p class="tagline">A duel of four elements on a rising tide.</p>
    <div class="rules-card">
      <p><b>30 life</b> each · <b>10 mana</b> refills every turn · draw a card each turn.</p>
      <p><span class="chip el-ember">▲ Ember</span> hits hard · <span class="chip el-tide">● Tide</span> swells with the tide ·
      <span class="chip el-thorn">◆ Thorn</span> stands firm · <span class="chip el-gloom">☾ Gloom</span> drains and shields.</p>
      <p><b>Synergy:</b> a second card of one element in a turn gains +1. <b>Tide:</b> the shared meter rises each turn and empowers Tide cards.</p>
      <p><b>Read the Warden:</b> its next move is declared before your turn ends — counter it with a spell.</p>
    </div>
    <button id="start-btn" class="bigbtn">BEGIN THE DUEL</button>
    <p class="keys">Mouse or keyboard: 1–9 play cards · Enter ends turn · Esc cancels</p>
  </div>`;
}

function endHtml(state, won) {
  const confetti = won ? Array.from({ length: 36 }, (_, i) =>
    `<i class="confetti" style="--x:${(i * 37) % 100}%;--d:${(i % 9) * 0.12}s;--c:${['#e5484d', '#2f7fe0', '#2fae5f', '#8b5cf6', '#f5c542'][i % 5]}"></i>`).join('') : '';
  return `<div class="end-screen ${won ? 'win' : 'loss'}">${confetti}
    <h1>${won ? 'VICTORY!' : 'THE TIDE TAKES YOU'}</h1>
    <p class="end-score">You ${state.player.life} ❤ — Rune Warden ${state.ai.life} ❤ · ${state.turn} turns</p>
    <p class="end-flavour">${won
      ? 'The Warden bows. The tide is yours — every rune you played is still humming.'
      : 'The Warden stands over the table. Shuffle up and ride the tide again.'}</p>
    <button id="again-btn" class="bigbtn">${won ? 'PLAY AGAIN' : 'REMATCH'}</button>
  </div>`;
}

# Rune Tide — a card duel of four elements

![Rune Tide](https://make.fun/badge/best-card-game-20261122-1826.svg)
![Rank](https://make.fun/badge/best-card-game-20261122-1826/Abdul0204/runetide-cards/rank.svg)
![Reward](https://make.fun/badge/best-card-game-20261122-1826/Abdul0204/runetide-cards/reward.svg)

A complete, original browser card battler built for make.fun's
[best card game bounty](https://make.fun/c/best-card-game-20261122-1826/).
No build step, no network requests, no libraries — vanilla JS + CSS under `game/`.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
server). You duel the Rune Warden: **30 life** each, **10 mana** refilling every
turn, draw a card each turn. Play creature and spell cards from your hand,
attack with your creatures, and bring the Warden to 0 life first.

- **Four elements**, told apart by colour *and* shape: ▲ Ember (red), ● Tide
  (blue), ◆ Thorn (green), ☾ Gloom (purple).
- **Synergy:** the second card of one element you play in a turn gains +1.
- **Tide:** a shared tide meter rises every turn; Tide cards gain +1 attack at
  tide 3, +2 at tide 5.
- **Read the Warden:** its next move is declared before your turn ends, so you
  can counter it — freeze its creatures with Stillwater, shield yourself with
  Gloom Veil, or burn its attacker with Ember Burst.
- Mouse or keyboard: keys 1–9 play cards, Enter ends the turn, Esc cancels.

## Layout

- `game/index.html` — the page; `game/style.css` — the table and card art.
- `game/src/deck.js` — the card pool, elements and deck building.
- `game/src/rules.js` — turn, mana, combat and the synergy/tide mechanics.
- `game/src/ai.js` — the Rune Warden's plans, its declared intent, and its turn.
- `game/src/render.js` — DOM rendering and animations.
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=title|table|win|loss`).
- `game/src/main.js` — the game loop and input.
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json`.
- `screenshots/` — four real renders of the game's own code.

## License

MIT — see `LICENSE`.

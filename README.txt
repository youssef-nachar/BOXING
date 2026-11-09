RING CLASH - multiplayer wrestling with split screen and phone controllers
Run: serve this folder (npx serve, or any static host over HTTPS). Open index.html on the big screen, scan the QR with phones (controller.html).
Needs internet for Three.js, PeerJS and QRCode CDNs.
Phone: left stick moves (camera locks onto nearest opponent), PUNCH fast / KICK slow + knockdown / GRAB beats block and throws / BLOCK reduces damage 85%.
Hits fill the SPECIAL bar; at 100% your next GRAB is a FINISHER (40 dmg). Hitting the ropes at speed hurts. Last one standing wins; the ring resets after 4.5 s.
Keyboard (player 1): WASD move, J punch, K kick, L grab, SPACE block. 2-4 fighters, split screen adapts (full / side by side / 2x2).
Tuning: ATK table, MAXP, RING, CRESET at the top of game.js.

V2 additions: BOTS button in the lobby (0-3 AI fighters; a joining phone replaces a bot), 3 fighter classes picked on the phone (BRAWLER / SPEEDSTER fast+weak / TANK slow+strong),
DASH / DODGE button (Shift on keyboard) with invulnerability frames, combo multiplier (+10% per chained hit, up to x1.5), camera shake, slow-motion on finishers and K.O.s,
synth sound effects, first to 3 round wins is crowned champion and the scores reset.

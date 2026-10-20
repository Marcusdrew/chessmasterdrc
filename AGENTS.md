# Architecture rules
- Keep chess rules and move validation in chess.js; background AI work must be invalidated when a match ends, resets, or unmounts to prevent stale moves from reopening play.
- Keep review results cached for the current move history within the review component, and show only one end-of-game overlay at a time to prevent accidental rematches.
- Animate board moves from explicit move coordinates, including the castling rook, without changing chess state or delaying the clocks.
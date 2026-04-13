# Round 3 — "Who Am I?" photos

Drop four celebrity photos here. The filenames are positional — they
map to the four questions in `server/questions/whoAmI.js` in order:

```
1.jpg   # Question 1 — Albert Einstein
2.jpg   # Question 2 — Dwayne "The Rock" Johnson
3.jpg   # Question 3 — David Attenborough
4.jpg   # Question 4 — Beyoncé
```

To change the celebrity for a slot, just replace the numbered file
*and* update the matching `options` + `correctAnswer` in
`server/questions/whoAmI.js`.

## Photo requirements

- **Minimum 500×500px**. The de-pixelation reveal looks flat if the source is smaller.
- **Portrait or square crop**. Landscape photos waste space in the game's visual area.
- **Face fills the frame**. Tight crops make the puzzle more fun.
- **Simple background**. Busy backgrounds create confusing pixel blobs.
- **JPEG or PNG**. JPEG is fine — the image gets heavily downsampled anyway.

Licensing is on you — Wikimedia Commons, Unsplash, and Pexels are safe sources.
This is an internal team party game so stock photos or press shots are fine.

## If a photo is missing

The `PixelReveal` component shows a clear ⚠️ fallback instead of crashing the
game, so you can deploy and play even before all four photos are in place.

## Why this folder (not `src/assets/`)

Vite serves everything under `client/public/` at the site root. Put a file at
`client/public/assets/celebrities/einstein.jpg` and the client will fetch it
from `/assets/celebrities/einstein.jpg`. That's the path the question data
references.

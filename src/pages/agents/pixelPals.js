/*
 * Tiny 8-bit "pixel pals" — one original little sprite per agent that perches on
 * the top-left edge of its log panel (in the spirit of a terminal mascot, but
 * our own characters). Each pal is a 16×16 grid of single-char palette keys;
 * '.' is transparent. Two `idle` frames give a gentle bob/blink loop, and the
 * `work` frame plays while the agent's log is streaming.
 *
 * Sprites are generated (see scratchpad/genPals.js); edit there and re-paste.
 */

export const PAL_SIZE = 16;

export const PALETTE = {
  '.': null,
  o: '#0c0d0f', // outline
  k: '#20242b', // shadow / screen
  w: '#eef2f7', // white / paper
  s: '#c9d1db', // light body
  d: '#8a94a2', // mid (closed eyes)
  a: '#e0763b', // amber — LIRA
  b: '#4f9be6', // blue — Tallie
  g: '#5ec98a', // green — Kidd
  y: '#f2c14e', // gold — "working"
};

export const PIXEL_PALS = {
  lira: {
    idle: [
      [
        '.......oo.......',
        '....ooooooo.....',
        '....okkkkko.....',
        '....oaaaaao.....',
        '....oaaaaao.....',
        '....oaaaaao.....',
        '....okkkkko.....',
        '....ooooooo.....',
        '.......oo..oooo.',
        '..oooooooooowwo.',
        '..oosssssssokko.',
        '..oosaaaaaaowwo.',
        '...oooooooookko.',
        '.....oo..oooooo.',
        '....ooo..ooo....',
        '................',
      ],
      [
        '.......oo.......',
        '....ooooooo.....',
        '....okkkkko.....',
        '....okkkkko.....',
        '....odddddo.....',
        '....okkkkko.....',
        '....okkkkko.....',
        '....ooooooo.....',
        '.......oo..oooo.',
        '..oooooooooowwo.',
        '..oosssssssokko.',
        '..oosaaaaaaowwo.',
        '...oooooooookko.',
        '.....oo..oooooo.',
        '....ooo..ooo....',
        '................',
      ],
    ],
    work: [
      '.......oo.......',
      '....ooooooo.....',
      '....okkkkko.....',
      '....oyyyyyo.....',
      '....oyyyyyo.....',
      '....oyyyyyo.....',
      '....okkkkko.....',
      '....ooooooo.....',
      '.......oo..oooo.',
      '..ooooooooooyyo.',
      '..oosyyyyyyokko.',
      '..oosyyyyyyoyyo.',
      '...oooooooookko.',
      '.....oo..oooooo.',
      '....ooo..ooo....',
      '................',
    ],
  },
  tallie: {
    idle: [
      [
        '.......oo.......',
        '....oooooooo....',
        '....okkkkkko....',
        '....obbkkbbo....',
        '....obbkkbbo....',
        '....okkkkkko....',
        '....okkkkkko....',
        '....oooooooo....',
        '.......oo.......',
        '...oooooooooo...',
        '...oskkbkkbso...',
        '...obkkbkkbso...',
        '...oooooooooo...',
        '.....oo..oo.....',
        '....ooo..ooo....',
        '................',
      ],
      [
        '.......oo.......',
        '....oooooooo....',
        '....okkkkkko....',
        '....okkkkkko....',
        '....oddkkddo....',
        '....okkkkkko....',
        '....okkkkkko....',
        '....oooooooo....',
        '.......oo.......',
        '...oooooooooo...',
        '...obkkkkkbso...',
        '...obkkbkkbso...',
        '...oooooooooo...',
        '.....oo..oo.....',
        '....ooo..ooo....',
        '................',
      ],
    ],
    work: [
      '.......oo.......',
      '....oooooooo....',
      '....okkkkkko....',
      '....oyykkyyo....',
      '....oyykkyyo....',
      '....okkkkkko....',
      '....okkkkkko....',
      '....oooooooo....',
      '.......oo.......',
      '...oooooooooo...',
      '...oykkykkyso...',
      '...oykkykkyso...',
      '...oooooooooo...',
      '.....oo..oo.....',
      '....ooo..ooo....',
      '................',
    ],
  },
  kidd: {
    idle: [
      [
        '................',
        '..yyyyyyyyyyyo..',
        '...yyyyyyyyyy.y.',
        '......oooo....y.',
        '....oooooooo....',
        '....owwkkwwo....',
        '....owwkkwwo....',
        '....okwwwwko....',
        '....oooooooo....',
        '...oooooooooo...',
        '...oggggggggo...',
        '...oggggggggo...',
        '...oooooooooo...',
        '.....oo..oo.....',
        '....ooo..ooo....',
        '................',
      ],
      [
        '................',
        '..yyyyyyyyyyyo..',
        '...yyyyyyyyyy.y.',
        '......oooo....y.',
        '....oooooooo....',
        '....okkkkkko....',
        '....oddkkddo....',
        '....okwwwwko....',
        '....oooooooo....',
        '...oooooooooo...',
        '...oggggggggo...',
        '...oggggggggo...',
        '...oooooooooo...',
        '.....oo..oo.....',
        '....ooo..ooo....',
        '................',
      ],
    ],
    work: [
      '................',
      '..yyyyyyyyyyyo..',
      '...yyyyyyyyyy.y.',
      '......oooo....y.',
      '....oooooooo....',
      '....oyykkyyo....',
      '....oyykkyyo....',
      '....okwwwwko....',
      '....oooooooo....',
      '...oooooooooo...',
      '...ogyyyyyygo...',
      '...ogyyyyyygo...',
      '...oooooooooo...',
      '.....oo..oo.....',
      '....ooo..ooo....',
      '................',
    ],
  },
};

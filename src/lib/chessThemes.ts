// Définitions des thèmes d'échiquier et de couleurs de pièces.
// Les valeurs de rendu vivent dans src/index.css (variables CSS pilotées
// par les attributs data-board-theme / data-piece-theme sur <html>) ;
// les couleurs ci-dessous servent uniquement aux pastilles d'aperçu
// du sélecteur de thème.

export const BOARD_THEMES = ['classique', 'vert', 'bleu', 'ardoise', 'nuit'] as const;
export const PIECE_THEMES = ['classique', 'contraste', 'creme', 'saphir'] as const;

export type BoardTheme = (typeof BOARD_THEMES)[number];
export type PieceTheme = (typeof PIECE_THEMES)[number];

/** Couleurs d'aperçu des cases (claire, foncée) pour chaque thème d'échiquier. */
export const BOARD_THEME_PREVIEW: Record<BoardTheme, { light: string; dark: string }> = {
  classique: { light: 'hsl(37 35% 82%)', dark: 'hsl(25 25% 45%)' },
  vert: { light: 'hsl(90 25% 88%)', dark: 'hsl(140 30% 40%)' },
  bleu: { light: 'hsl(205 35% 88%)', dark: 'hsl(210 45% 42%)' },
  ardoise: { light: 'hsl(30 8% 88%)', dark: 'hsl(220 8% 40%)' },
  nuit: { light: 'hsl(225 15% 32%)', dark: 'hsl(230 20% 18%)' },
};

/** Couleurs d'aperçu des pièces (remplissage clair, foncé, contour) par thème. */
export const PIECE_THEME_PREVIEW: Record<PieceTheme, { w: string; b: string; stroke: string }> = {
  classique: { w: 'hsl(38 35% 94%)', b: 'hsl(20 10% 12%)', stroke: 'hsl(20 10% 12%)' },
  contraste: { w: 'hsl(0 0% 100%)', b: 'hsl(0 0% 4%)', stroke: 'hsl(0 0% 4%)' },
  creme: { w: 'hsl(40 60% 92%)', b: 'hsl(20 55% 22%)', stroke: 'hsl(20 55% 16%)' },
  saphir: { w: 'hsl(40 60% 94%)', b: 'hsl(215 60% 28%)', stroke: 'hsl(215 60% 16%)' },
};

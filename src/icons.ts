/**
 * The site's icon set.
 *
 * Authored rather than pulled from a font: a dozen glyphs are not worth an
 * icon package, and this site loads nothing from a third party anyway. Every
 * icon is drawn on the same 24px grid at the same 1.75px stroke with round
 * caps and joins — the thing that keeps a hand-made set reading as a set.
 * This matches the set on openpgpkey.itzemoji.com, so the two sites' chrome
 * is drawn by the same hand.
 *
 * Icons are decorative here — every one sits beside a text label — so they
 * are hidden from assistive technology.
 */

function icon(body: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const icons = {
  /** Brand mark: an open book, the counterpart to the key on the WKD site. */
  book: icon(
    '<path d="M12 6.5C10.5 5 8.6 4.2 6 4.2A2 2 0 0 0 4 6.2v10.6a2 2 0 0 0 2 2c2.6 0 4.5.8 6 2.3"/>' +
      '<path d="M12 6.5c1.5-1.5 3.4-2.3 6-2.3a2 2 0 0 1 2 2v10.6a2 2 0 0 1-2 2c-2.6 0-4.5.8-6 2.3z"/>' +
      '<path d="M12 6.5v14.6"/>',
  ),

  /** Sits at the end of every row: this entry leads somewhere. */
  chevronRight: icon('<path d="m9.5 6 6 6-6 6"/>'),
} as const;

export type IconName = keyof typeof icons;

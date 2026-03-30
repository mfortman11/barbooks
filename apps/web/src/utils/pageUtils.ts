/**
 * In a standard book, odd-numbered pages appear on the right (recto)
 * and even-numbered pages appear on the left (verso).
 */
export type BookSide = 'left' | 'right';

export function getBookSide(pageNum: number): BookSide {
  return pageNum % 2 === 0 ? 'left' : 'right';
}

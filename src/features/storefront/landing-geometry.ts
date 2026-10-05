/** Responsive motion geometry; positions are centers within the measured hero stage. */
export interface HeroGeometry { width: number; headingWidth: number; headingTop: number; headingHeight: number; galleryCenter: number; photoWidth: number }
export const heroPhases = [0, 0.55, 1];
export function heroPhotoPath(index: number, g: HeroGeometry) {
  const startX = [0.12, 0.88, 0.12][index] * g.width;
  const endX = [0.39, 0.51, 0.63][index] * g.width;
  const startY = g.headingTop + g.headingHeight * [0.42, 0.62, 1.8][index];
  const endY = g.galleryCenter + [20, -12, 12][index];
  const x = [startX, endX, endX].map(v => v - g.photoWidth / 2);
  const y = [startY, endY, endY].map(v => v - g.photoWidth * 2 / 3);
  return {x, y, scale: [[0.5, 0.94, 1], [0.5, 0.94, 1], [0.65, 0.96, 1]][index], rotate: [[4, -10, -18], [-6, -6, -6], [-10, 0, 4]][index]};
}
export function benefitJourney(stageWidth: number, trackWidth: number, cardWidth: number, stageHeight: number) {
  const start = stageWidth + cardWidth * 0.15;
  const end = -trackWidth - cardWidth * 0.15;
  const travel = start - end;
  return {start, end, travel, height: stageHeight + travel * 0.7};
}

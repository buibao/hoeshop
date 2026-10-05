import {describe,it,expect} from 'vitest';
import {heroPhotoPath,benefitJourney} from '@/features/storefront/landing-geometry';
describe('responsive native-scroll journeys',()=>{
  it('starts at opposite sides and converges below the copy, at full scale',()=>{
    const g={width:1400,headingWidth:924,headingTop:50,headingHeight:270,galleryCenter:1000,photoWidth:378};
    const paths=[0,1,2].map(i=>heroPhotoPath(i,g));
    expect(paths[0].x[0]).toBeLessThan(paths[0].x[2]);expect(paths[1].x[0]).toBeGreaterThan(paths[1].x[2]);
    for(const p of paths){expect(p.y[2]).toBeGreaterThan(p.y[0]);expect(p.scale[2]).toBe(1);expect(p.scale[1]).toBeGreaterThan(p.scale[0]);}
    expect(paths.map(p=>p.rotate[2])).toEqual([-18,-6,4]);
    const taller=heroPhotoPath(0,{...g,galleryCenter:1400});expect(taller.y[2]-paths[0].y[2]).toBe(400);
  });
  it('reserves enough native travel for every benefit, including ten cards',()=>{
    for(const width of [1024,1440])for(const count of [1,3,10]){
      const card=width*.3,track=card*count+48*(count-1),j=benefitJourney(width,track,card,800);
      expect(j.start).toBeGreaterThan(width);expect(j.end+track).toBeLessThan(0);expect(j.height-800).toBeCloseTo(j.travel*.7);
    }
    expect(benefitJourney(1400,4000,400,800).travel).toBeGreaterThan(benefitJourney(1400,1200,400,800).travel);
  });
});

/** 創作者空間（對應網址 /{id}）；文案預設為英文 */
export const SPACE_IDS = ['solilium', 'voidlane', 'lumenlab'] as const;
export type SpaceId = (typeof SPACE_IDS)[number];

export function isSpaceId(s: string): s is SpaceId {
  return (SPACE_IDS as readonly string[]).includes(s);
}

export interface SpaceDef {
  id: SpaceId;
  navLabel: string;
  platformName: string;
  tagline: string;
  heroKicker: string;
  heroTag: string;
  heroDesc: string;
  heroLine1: string;
  heroLine2: string;
  aboutTitle: string;
  aboutLead: string;
  aboutSecond: string;
  quoteBand: string;
  quoteBandAttr: string;
  magneticLabel: string;
}

export const SPACES: Record<SpaceId, SpaceDef> = {
  solilium: {
    id: 'solilium',
    navLabel: 'SOLILIUM',
    platformName: 'SOLILIUM',
    tagline: 'Photography & visual creation',
    heroKicker:
      'At SOLILIUM, <strong>align the gaze first</strong>—then let the frame speak.',
    heroTag: 'Visual Portfolio',
    heroDesc:
      'Photography & visual creation.<br />Geometry, light, and the spaces between.',
    heroLine1: 'SOLI',
    heroLine2: 'LIUM',
    aboutTitle: 'Solilium',
    aboutLead:
      'A visual practice focused on tension between geometry and light—using photography to read order and chaos in the city.',
    aboutSecond: 'Each image is a quiet redefinition of space.',
    quoteBand:
      'The moment light catches an edge, architecture begins to speak—the lens only slows that sentence down.',
    quoteBandAttr: 'On seeing',
    magneticLabel: 'VIEW →',
  },
  voidlane: {
    id: 'voidlane',
    navLabel: 'VOID LANE',
    platformName: 'VOID LANE',
    tagline: 'Experimental motion & digital texture',
    heroKicker:
      'VOID LANE treats <strong>noise and afterimages</strong> as narrative matter.',
    heroTag: 'Motion Lab',
    heroDesc:
      'Digital artifacts, scan lines, and rhythm.<br />Where the signal breaks, the story begins.',
    heroLine1: 'VOID',
    heroLine2: 'LANE',
    aboutTitle: 'Void Lane',
    aboutLead:
      'Motion and experimental textures—embracing distortion as tone and “error aesthetics” as readable rhythm.',
    aboutSecond: 'We look for order inside noise and feeling inside dropout.',
    quoteBand: 'The frame does not need perfection—only the right micro-shiver.',
    quoteBandAttr: 'Signal note',
    magneticLabel: 'DRIFT →',
  },
  lumenlab: {
    id: 'lumenlab',
    navLabel: 'LUMEN LAB',
    platformName: 'LUMEN LAB',
    tagline: 'Light studies & soft form',
    heroKicker: 'LUMEN LAB believes <strong>light precedes form</strong>—form is light pausing.',
    heroTag: 'Light Studies',
    heroDesc:
      'Soft gradients, volume, and quiet contrast.<br />Minimal frames, maximum breath.',
    heroLine1: 'LUMEN',
    heroLine2: 'LAB',
    aboutTitle: 'Lumen Lab',
    aboutLead:
      'A study of light and material—using minimal frames to carry emotional weight; negative space invites the viewer in.',
    aboutSecond: 'We record not objects, but how objects are lit.',
    quoteBand: 'The deeper the shadow, the more the highlight resembles an unspoken line.',
    quoteBandAttr: 'On luminance',
    magneticLabel: 'GLOW →',
  },
};

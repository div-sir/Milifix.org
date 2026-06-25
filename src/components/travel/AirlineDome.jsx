import DomeGallery from './DomeGallery';

export default function AirlineDome({ airlines }) {
  const images = airlines.map((a) => ({
    src: a.logo?.url ?? `https://pics.avs.io/200/200/${a.iataCode}.png`,
    alt: `${a.name} (${a.iataCode})`,
  }));

  return (
    <div style={{ width: '100%', height: '420px' }}>
      <DomeGallery
        images={images}
        fit={0.55}
        minRadius={400}
        segments={25}
        grayscale={false}
        imageBorderRadius="12px"
        openedImageBorderRadius="16px"
        openedImageWidth="200px"
        openedImageHeight="200px"
        overlayBlurColor="var(--bg, #111318)"
        padFactor={0.2}
      />
    </div>
  );
}

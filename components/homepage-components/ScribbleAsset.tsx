import Image from "next/image";

interface ScribbleAssetProps {
  src: string;
  alt: string;
  wrapperClassName: string;
  innerClassName: string;
}

export function ScribbleAsset({
  src,
  alt,
  wrapperClassName,
  innerClassName,
}: ScribbleAssetProps) {
  return (
    <div className={wrapperClassName}>
      <div className={innerClassName}>
        <Image src={src} alt={alt} fill className="object-contain" priority />
      </div>
    </div>
  );
}

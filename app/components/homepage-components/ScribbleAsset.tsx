import Image from "next/image";

interface ScribbleAssetProps {
    src: string;
    alt: string;
    wrapperClassName: string;
    innerClassName: string;
    sizes?: string;
}

export function ScribbleAsset({
    src,
    alt,
    wrapperClassName,
    innerClassName,
    sizes = "100vw",
}: ScribbleAssetProps) {
    return (
        <div className={wrapperClassName}>
            <div className={innerClassName} style={{ position: "relative" }}>
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    priority
                    sizes={sizes}
                />
            </div>
        </div>
    );
}

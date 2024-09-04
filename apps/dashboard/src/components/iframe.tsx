export function Iframe({
  src,
  width,
  height,
  onLoaded,
  setError,
  preview,
}: {
  src: string;
  width: number;
  height: number;
  preview: boolean;
  onLoaded: (loaded: boolean) => void;
  setError: (error: boolean) => void;
}) {
  return (
    <div className="overflow-hidden w-full h-full">
      <iframe
        title="Preview"
        src={`${src}#toolbar=0&scrollbar=0`}
        width={width}
        height={height}
        onLoad={() => {
          setTimeout(() => {
            onLoaded(true);
          }, 150);
        }}
        allowTransparency
        allowFullScreen={false}
        style={{
          marginLeft: preview ? 0 : -8,
          marginTop: preview ? 0 : -8,
          width: preview ? width : "calc(100% + 16px)",
          height: preview ? height : "calc(100% + 16px)",
          overflow: "hidden",
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}

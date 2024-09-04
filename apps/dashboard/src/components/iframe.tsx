export function Iframe({
  src,
  width,
  height,
  onLoaded,
  setError,
}: {
  src: string;
  width: number;
  height: number;
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
          marginLeft: -8,
          marginTop: -8,
          width: "calc(100% + 16px)",
          height: "calc(100% + 16px)",
          overflow: "hidden",
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}

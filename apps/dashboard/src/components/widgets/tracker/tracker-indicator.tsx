interface Props {
  count: number;
}

export function TrackerIndicator({ count }: Props) {
  if (count === 1) {
    return (
      <div className="absolute bottom-2 left-3 right-3">
        <div className="h-1 w-1/2 bg-border" />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="absolute bottom-2 left-3 right-3 flex justify-center space-x-1">
        <div className="h-1 w-1/2 bg-border" />
        <div className="h-1 w-1/2 bg-border" />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="absolute bottom-2 left-3 flex justify-center space-x-1">
        <div className="h-1 w-1/3 bg-border" />
        <div className="h-1 w-1/3 bg-border" />
        <div className="h-1 w-1/3 bg-border" />
      </div>
    );
  }

  if (count > 3) {
    return (
      <div className="absolute bottom-2 left-3 right-3">
        <div className="h-1 w-full bg-border" />
      </div>
    );
  }

  return null;
}

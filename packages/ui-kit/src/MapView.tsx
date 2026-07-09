export type MapViewProps = {
  center?: string;
};

export function MapView({ center = 'SBTS network' }: MapViewProps) {
  return <div>{center}</div>;
}
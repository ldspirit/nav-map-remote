'use client';

export default function AddressPanel({
  coords,
  address,
  onCreate,
  onCopy,
  loading
}: {
  coords: { lat: number; lng: number } | null;
  address: string;
  onCreate: () => void;
  onCopy: () => void;
  loading: boolean;
}) {
  return (
    <div className="panel">
      <div>Selected: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Tap map'}</div>
      <button className="button" onClick={onCreate} disabled={!coords || loading}>{loading ? 'Working...' : 'Create Address'}</button>
      <div>Address: {address}</div>
      {address && (
        <button className="button" onClick={onCopy} style={{ background: '#2e7d32' }}>Copy Address</button>
      )}
    </div>
  );
}

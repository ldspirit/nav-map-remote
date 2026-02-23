'use client';

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  results,
  onSelect,
  selected
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  onClear: () => void;
  results: any[];
  onSelect: (r: any, idx: number) => void;
  selected: number | null;
}) {
  return (
    <div className="panel">
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder="Search address" />
      <button className="button" onClick={onSearch}>Search</button>
      <button className="button" onClick={onClear} style={{ marginLeft: 8, background: '#666' }}>Clear</button>
      <ul>
        {results.length === 0 && value.trim() && (
          <li style={{ color: '#666', fontStyle: 'italic' }}>No results</li>
        )}
        {results.map((r, i) => (
          <li key={i}
              style={{ cursor: 'pointer', background: selected === i ? '#eef3ff' : 'transparent', padding: '4px', borderRadius: '4px' }}
              onClick={() => onSelect(r, i)}>
            {r.full_address}
          </li>
        ))}
      </ul>
    </div>
  );
}

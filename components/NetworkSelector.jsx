'use client';

const NETWORKS = [
  { id: 'MTN', label: 'MTN', color: 'bg-yellow-400 text-black' },
  { id: 'Airtel', label: 'Airtel', color: 'bg-red-500 text-white' },
  { id: 'Glo', label: 'Glo', color: 'bg-green-500 text-white' },
  { id: '9mobile', label: '9mobile', color: 'bg-teal-500 text-white' },
];

export default function NetworkSelector({ selectedNetwork, onNetworkChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {NETWORKS.map((network) => (
        <button
          key={network.id}
          onClick={() => onNetworkChange(network.id)}
          className={`h-12 w-full rounded-xl font-semibold text-sm transition ${
            selectedNetwork === network.id
              ? network.color
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {network.label}
        </button>
      ))}
    </div>
  );
}

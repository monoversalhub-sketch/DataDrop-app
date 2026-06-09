'use client';

import { useState } from 'react';

export default function OrderLookup({ onClose }) {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/lookup?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setOrders([]);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'expired':
        return 'bg-amber-500 text-white';
      case 'pending':
      case 'processing':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-zinc-600 text-white';
    }
  };

  const getRelativeTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-end z-50">
      <div className="bg-zinc-900 rounded-t-3xl fixed bottom-0 left-0 right-0 p-6 max-h-[80vh] overflow-y-auto w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
        >
          ✕
        </button>

        <div className="max-w-sm mx-auto space-y-4">
          <h2 className="text-xl font-bold text-white">Check a Previous Order</h2>

          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-xl h-12 px-4 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-600 text-black font-bold h-12 px-6 rounded-xl transition"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {searched && (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-center text-zinc-400 py-4">
                  No orders found for this number.
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-zinc-800 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">
                        {order.data_plan_name}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{order.network}</p>
                    <p className="text-xs text-zinc-500">
                      {getRelativeTime(order.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

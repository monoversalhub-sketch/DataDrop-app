'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function StatusScreen({
  status,
  dataPlanName,
  network,
  onReset,
}) {
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-emerald-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-emerald-300 mb-2">
            Data is on the way! 🎉
          </h1>
          <p className="text-emerald-200 mb-6">
            Your {dataPlanName} for {network} has been sent to your number. It
            should arrive within 60 seconds.
          </p>
          <button
            onClick={onReset}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12 w-full rounded-xl text-base transition"
          >
            Buy More Data
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="fixed inset-0 bg-red-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-300 mb-2">Delivery failed</h1>
          <p className="text-red-200 mb-6">
            Your order could not be processed. You will receive a refund within
            24 hours.
          </p>
          <button
            onClick={onReset}
            className="bg-red-500 hover:bg-red-400 text-white font-bold h-12 w-full rounded-xl text-base transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            Payment window expired
          </h1>
          <p className="text-zinc-400 mb-6">
            The 20-minute transfer window has closed.
          </p>
          <button
            onClick={onReset}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12 w-full rounded-xl text-base transition"
          >
            Start a New Order
          </button>
        </div>
      </div>
    );
  }

  return null;
}

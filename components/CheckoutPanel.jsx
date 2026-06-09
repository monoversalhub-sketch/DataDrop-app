'use client';

import { useState, useEffect } from 'react';
import CountdownTimer from './CountdownTimer';
import StatusScreen from './StatusScreen';

export default function CheckoutPanel({ checkoutData, onReset }) {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!checkoutData?.payment_reference) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/status/${checkoutData.payment_reference}`
        );
        if (!response.ok) return;

        const data = await response.json();
        setStatus(data.status);

        // Stop polling when terminal status reached
        if (data.status === 'success' || data.status === 'failed' || data.status === 'expired') {
          return;
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    };

    // Initial poll
    pollStatus();

    // Set up interval
    const interval = setInterval(() => {
      if (status === 'success' || status === 'failed' || status === 'expired') {
        clearInterval(interval);
        return;
      }
      pollStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkoutData?.payment_reference, status]);

  if (status === 'success') {
    return (
      <StatusScreen
        status="success"
        dataPlanName={checkoutData.data_plan_name}
        network={checkoutData.network}
        onReset={onReset}
      />
    );
  }

  if (status === 'failed') {
    return (
      <StatusScreen
        status="failed"
        dataPlanName={checkoutData.data_plan_name}
        network={checkoutData.network}
        onReset={onReset}
      />
    );
  }

  if (status === 'expired') {
    return (
      <StatusScreen
        status="expired"
        dataPlanName={checkoutData.data_plan_name}
        network={checkoutData.network}
        onReset={onReset}
      />
    );
  }

  // Pending or processing state
  const copyToClipboard = () => {
    navigator.clipboard.writeText(checkoutData.virtual_account_num);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-end z-50">
      <div className="bg-zinc-900 rounded-t-3xl fixed bottom-0 left-0 right-0 p-6 max-h-[85vh] overflow-y-auto w-full">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Close button */}
          <button
            onClick={onReset}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
          >
            ✕
          </button>

          {/* Bank details */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 mb-2">
              Bank Transfer
            </h2>
            <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Bank</p>
                <p className="text-lg font-bold text-white">
                  {checkoutData.virtual_bank_name}
                </p>
              </div>

              <div>
                <p className="text-xs text-zinc-400 mb-1">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-mono font-bold text-white">
                    {checkoutData.virtual_account_num}
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded-lg text-white transition"
                    title="Copy account number"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-400 mb-1">Amount</p>
                <p className="text-xl font-bold text-emerald-400">
                  Transfer exactly ₦{checkoutData.amount}.00
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Do not transfer a different amount or the payment may not be
                  detected.
                </p>
              </div>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-400 mb-3">Time remaining</p>
            <CountdownTimer expiresAt={checkoutData.expires_at} />
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <p>Waiting for your transfer...</p>
          </div>

          {/* Plan info */}
          <div className="bg-zinc-800 rounded-xl p-4 text-sm">
            <p className="text-zinc-400 mb-1">Order</p>
            <p className="text-white font-semibold">
              {checkoutData.data_plan_name} ({checkoutData.network})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

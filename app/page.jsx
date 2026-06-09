'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import NetworkSelector from '@/components/NetworkSelector';
import PlanGrid from '@/components/PlanGrid';
import PhoneInput from '@/components/PhoneInput';
import CheckoutPanel from '@/components/CheckoutPanel';
import OrderLookup from '@/components/OrderLookup';

export default function Home() {
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altContact, setAltContact] = useState('');
  const [checkoutData, setCheckoutData] = useState(null);
  const [showLookup, setShowLookup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast.error('Please select a plan and enter your phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          alternative_contact: altContact,
          network: selectedNetwork,
          data_plan_id: selectedPlan.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Checkout failed');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setCheckoutData(data);
      toast.success('Virtual account created!');
    } catch (err) {
      toast.error(err.message || 'Checkout error');
    }

    setLoading(false);
  };

  const handleReset = () => {
    setCheckoutData(null);
    setSelectedPlan(null);
  };

  if (showLookup) {
    return <OrderLookup onClose={() => setShowLookup(false)} />;
  }

  if (checkoutData) {
    return <CheckoutPanel checkoutData={checkoutData} onReset={handleReset} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-emerald-400">DataDrop</h1>
          <p className="text-zinc-400">Buy mobile data instantly</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Network Selector */}
          <div>
            <label className="text-sm font-semibold text-zinc-300 block mb-3">
              Select Network
            </label>
            <NetworkSelector
              selectedNetwork={selectedNetwork}
              onNetworkChange={setSelectedNetwork}
            />
          </div>

          {/* Plan Grid */}
          <div>
            <label className="text-sm font-semibold text-zinc-300 block mb-3">
              Choose Plan
            </label>
            <PlanGrid
              network={selectedNetwork}
              selectedPlanId={selectedPlan?.id}
              onPlanSelect={setSelectedPlan}
            />
          </div>

          {/* Phone Input */}
          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            label="Phone Number"
            placeholder="Enter your number (e.g., 08012345678)"
            storageKey="datadrop_phone"
          />

          {/* Alternative Contact */}
          <PhoneInput
            value={altContact}
            onChange={setAltContact}
            label="WhatsApp Number (Optional)"
            placeholder="For order updates"
            storageKey="datadrop_alt_contact"
          />

          {/* Pay Now Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || !selectedPlan || !phoneNumber}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-600 text-black font-bold h-14 w-full rounded-2xl text-lg transition disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </button>

          {/* Lookup Link */}
          <button
            onClick={() => setShowLookup(true)}
            className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300 transition"
          >
            Check a previous order
          </button>
        </div>
      </div>
    </main>
  );
}

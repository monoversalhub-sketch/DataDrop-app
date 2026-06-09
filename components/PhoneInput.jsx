'use client';

import { useEffect, useRef } from 'react';

export default function PhoneInput({
  value,
  onChange,
  label = 'Phone Number',
  placeholder = 'Enter your number',
  storageKey = 'datadrop_last_phone',
}) {
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      onChange(stored);
    }
  }, [storageKey, onChange]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      localStorage.setItem(storageKey, newValue);
    }, 500);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl h-12 px-4 w-full text-base placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

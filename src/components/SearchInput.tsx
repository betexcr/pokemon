"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ 
  onSearchChange, 
  placeholder = "Search Pokémon...", 
  className = "" 
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref to track the latest onSearchChange to avoid recreating the callback
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;
  
  // Handle input changes immediately without any delays
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Call the search change handler immediately
    onSearchChangeRef.current(newValue);
  }, []);
  
  // Handle clear button
  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearchChangeRef.current('');
    inputRef.current?.focus();
  }, []);
  
  // Expose a method to set the value from outside (for clearing search)
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      // Add a custom method to the input element
      (input as any).setValue = (value: string) => {
        setLocalValue(value);
      };
    }
  }, []);
  
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        className={`w-full pl-11 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-poke-blue focus:border-poke-blue focus:outline-none transition-all duration-200 ${className}`}
        style={{ 
          backgroundColor: 'var(--color-input-bg)', 
          color: 'var(--color-input-text)',
          paddingLeft: '2.75rem !important'
        }}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-text hover:text-poke-blue" />
        </button>
      )}
    </div>
  );
}

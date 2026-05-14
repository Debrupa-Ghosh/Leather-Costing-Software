import { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext(null);

const USD_TO_INR = 83.50;

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'INR'

  const toggleCurrency = useCallback(() => {
    setCurrency(prev => prev === 'USD' ? 'INR' : 'USD');
  }, []);

  const isINR = currency === 'INR';
  const rate = isINR ? USD_TO_INR : 1;
  const symbol = isINR ? '₹' : '$';

  /**
   * Convert a numeric dollar value and return formatted string.
   * @param {number} value - Amount in USD
   * @param {object} opts - { decimals, compact }
   */
  const formatCurrency = useCallback((value, opts = {}) => {
    if (value == null || isNaN(value)) return `${symbol}--`;
    const { decimals = 2, compact = false } = opts;
    const converted = value * rate;

    if (compact) {
      if (Math.abs(converted) >= 1_000_000) {
        return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(converted) >= 1_000) {
        return `${symbol}${(converted / 1_000).toFixed(1)}K`;
      }
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }, [rate, symbol]);

  /**
   * Convert a raw USD number to the active currency number (no formatting).
   */
  const convert = useCallback((value) => {
    if (value == null || isNaN(value)) return 0;
    return value * rate;
  }, [rate]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, isINR, rate, symbol, toggleCurrency, formatCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};

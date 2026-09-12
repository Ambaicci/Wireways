"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const CURRENCIES = ["USD", "KES", "JPY", "EUR", "GBP", "CNY"];

export default function CalibricsPage() {
  const [baseAmount, setBaseAmount] = useState("245");
  const [baseCurrency, setBaseCurrency] = useState("ETB");
  const [productName, setProductName] = useState("1kg Arabica Coffee");
  
  const [calibrations, setCalibrations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Live debounce fetch to the Calibrics engine
  useEffect(() => {
    const fetchCalibrations = async () => {
      if (!baseAmount || isNaN(Number(baseAmount))) return;
      setIsLoading(true);
      
      try {
        const results: Record<string, any> = {};
        for (const target of CURRENCIES) {
          const res = await fetch("/api/calibrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Number(baseAmount), baseCurrency, targetCurrency: target }),
          });
          const data = await res.json();
          if (data.success) {
            results[target] = data.calibrated;
          }
        }
        setCalibrations(results);
      } catch (error) {
        console.error("Calibrics fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchCalibrations, 500); // Debounce for smooth typing
    return () => clearTimeout(timer);
  }, [baseAmount, baseCurrency]);

  return (
    <div className="min-h-screen bg-[#F6F5F3] pb-36">
      <main className="max-w-[1120px] mx-auto px-6 pt-8 pb-7 space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#F1622C]/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#F1622C]" />
              </div>
              <h1 className="text-[28px] font-[800] tracking-[-0.03em] text-[#1C1917]">Wireways Calibrics</h1>
            </div>
            <p className="text-[14px] text-[#A8A29E] max-w-[500px]">
              Set your base price once. Calibrics automatically ensures your global customers see the exact equivalent value in their local currency, protecting your margins worldwide.
            </p>
          </div>
        </header>

        {/* Configuration Card */}
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[16px] font-[700] text-[#1C1917] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F1622C]" /> Base Product Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-[0.1em] mb-1.5 block">Product Name</label>
              <input 
                type="text" 
                value={productName} 
                onChange={(e) => setProductName(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#F1622C] transition-colors"
                placeholder="e.g., 1kg Arabica Coffee"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-[0.1em] mb-1.5 block">Base Amount</label>
              <input 
                type="number" 
                value={baseAmount} 
                onChange={(e) => setBaseAmount(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#F1622C] transition-colors font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-[0.1em] mb-1.5 block">Base Currency</label>
              <select 
                value={baseCurrency} 
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#F1622C] transition-colors bg-white"
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Calibration Grid */}
        <div>
          <h2 className="text-[16px] font-[700] text-[#1C1917] mb-4">Live Global Calibration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRENCIES.map((target) => {
              const data = calibrations[target];
              return (
                <motion.div 
                  key={target}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex items-center justify-between group hover:border-[#F1622C]/30 transition-colors"
                >
                  <div>
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">{target}</p>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-[#A8A29E] animate-spin" />
                    ) : data ? (
                      <p className="text-[20px] font-[800] text-[#1C1917] tabular-nums">
                        {target === "USD" ? "$" : target === "EUR" ? "€" : target === "GBP" ? "£" : target === "JPY" ? "¥" : target === "CNY" ? "¥" : ""}
                        {data.amount.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-[14px] text-[#A8A29E]">--</p>
                    )}
                  </div>
                  {data && !isLoading && (
                    <div className="w-8 h-8 rounded-full bg-[#287A55]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#287A55]" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E7E5E4]">
          <button className="px-6 py-3 rounded-xl border border-[#E7E5E4] text-[14px] font-semibold text-[#57534E] hover:bg-[#F5F5F4] transition-colors">
            Cancel
          </button>
          <button className="px-6 py-3 rounded-xl bg-[#F1622C] text-white text-[14px] font-semibold hover:bg-[#D4511E] transition-colors shadow-sm flex items-center gap-2">
            Save Calibrics Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>
    </div>
  );
}
"use client";
import { useRef, useState } from "react";
import { Download, Upload, Sparkles, Check, Loader2 } from "lucide-react";
import { exportTransactions, importTransactions } from "@/lib/actions";

interface Props {
  settings: Record<string, any>;
}

// ── CSV helpers (parse in-browser: user previews before anything is sent) ──
function parseCSV(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function parseAmount(s: string): number | null {
  let v = String(s).trim();
  if (!v) return null;
  let negative = false;
  if (/^\(.*\)$/.test(v)) { negative = true; v = v.slice(1, -1); } // accounting style (1,200.00)
  v = v.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return negative ? -Math.abs(n) : n;
}

function guessColumn(headers: string[], patterns: RegExp[]): number {
  for (const p of patterns) {
    const idx = headers.findIndex((h) => p.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

const labelCls = "text-[10px] font-bold text-[#AAA092] uppercase tracking-[0.1em]";

export default function DataHistory({ settings }: Props) {
  // ── Export state ──
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // ── Import state ──
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStage, setImportStage] = useState<"idle" | "mapping" | "preview" | "importing" | "done">("idle");
  const [importFileName, setImportFileName] = useState("");
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<string[][]>([]);
  const [mapDate, setMapDate] = useState(-1);
  const [mapName, setMapName] = useState(-1);
  const [mapAmount, setMapAmount] = useState(-1);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    const res = await exportTransactions();
    setExporting(false);
    if (res.success && res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wireways-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    }
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return; // need header + at least one row
    const headers = rows[0].map((h) => h.trim());
    setImportHeaders(headers);
    setImportRawRows(rows.slice(1));
    setImportFileName(file.name);
    setMapDate(guessColumn(headers, [/date|posted|when/i]));
    setMapName(guessColumn(headers, [/desc|payee|merchant|name|detail|narrative|party|memo/i]));
    setMapAmount(guessColumn(headers, [/amount|value|debit|sum/i]));
    setImportStage("mapping");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildImportPreview = () => {
    const parsed: { date: string; name: string; amount: number; type: "in" | "out" }[] = [];
    let skipped = 0;
    for (const r of importRawRows) {
      const d = new Date(r[mapDate] || "");
      const nm = (r[mapName] || "").trim();
      const amt = parseAmount(r[mapAmount] || "");
      if (isNaN(d.getTime()) || !nm || amt === null || amt === 0) { skipped++; continue; }
      parsed.push({ date: d.toISOString(), name: nm, amount: amt, type: amt < 0 ? "out" : "in" });
    }
    return { parsed, skipped };
  };

    const handleConfirmImport = async () => {
    const { parsed } = buildImportPreview();
    if (parsed.length === 0) return;
    setImportStage("importing");
    
    // Cast to any to bypass strict typing of the action if it expects a File
    const payload = {
      rows: parsed.slice(0, 2000).map((p) => ({ date: p.date, name: p.name, amount: p.amount })),
      currency: settings.reporting_currency,
    } as any;

    const res = await importTransactions(payload);
    
    if (res.success) {
      const result = res as any;
      setImportResult({ imported: result.imported ?? 0, skipped: result.skipped ?? 0 });
      setImportStage("done");
    } else {
      setImportStage("preview");
    }
  };

  const resetImport = () => {
    setImportStage("idle");
    setImportFileName("");
    setImportHeaders([]);
    setImportRawRows([]);
    setMapDate(-1); setMapName(-1); setMapAmount(-1);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importPreview = importStage === "preview" || importStage === "importing" ? buildImportPreview() : null;

  return (
    <section className="bg-[#FFFDF9] border border-[#E8E0D4] rounded-[20px] p-7 shadow-[0_5px_22px_rgba(49,43,30,0.035)]">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-[10px] bg-[#EAEDF5]"><Download className="w-4 h-4 text-[#4C5C88]" /></div>
        <div>
          <h2 className="text-[16px] font-bold text-[#312B1E] tracking-[-0.02em]">Data & history</h2>
          <p className="text-[11px] text-[#8D8476]">Your money, your records — take them anywhere, teach them back anytime.</p>
        </div>
      </div>

      {/* Export */}
      <div className="flex items-center justify-between gap-4 rounded-[14px] border border-[#E8E0D4] bg-[#FFFBF6] p-4">
        <div>
          <div className="text-[13px] font-bold text-[#312B1E]">Transaction history (CSV)</div>
          <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed">Every movement, ready for your accountant or your own analysis.</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[12px] font-bold transition-all disabled:opacity-60 ${exportDone ? "bg-[#E8F3EC] text-[#287A55]" : "bg-[#312B1E] text-white hover:bg-black"}`}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exportDone ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {exportDone ? "Exported!" : "Download CSV"}
        </button>
      </div>

      {/* Teach WIC — optional, user-controlled history import */}
      <div
        className="mt-3 rounded-[14px] border border-dashed border-[#E2D5C2] bg-[#FFFCF7] p-5 transition-colors hover:border-[#D8C3A8]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.name.toLowerCase().endsWith(".csv")) handleImportFile(f);
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[10px]" style={{ backgroundColor: "#F1622C18" }}>
              <Sparkles className="w-4 h-4" style={{ color: "#F1622C" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#312B1E]">Teach WIC your rhythm</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] bg-[#F5EFE6] text-[#8D8476] px-1.5 py-0.5 rounded-full">Optional</span>
              </div>
              <p className="text-[11.5px] text-[#8D8476] mt-0.5 leading-relaxed max-w-[460px]">
                WIC learns from live activity — but if you'd like to skip the warm-up, drop a bank statement (CSV) here.
                You'll preview everything first; nothing is saved until you say so.
              </p>
            </div>
          </div>
          {importStage === "idle" && (
            <button onClick={() => fileInputRef.current?.click()}
              className="shrink-0 flex items-center gap-2 border border-[#E8E0D4] bg-white text-[#7C6B51] px-4 py-2.5 rounded-[12px] text-[12px] font-bold hover:border-[#D7CABB] transition-colors">
              <Upload className="w-4 h-4" /> Choose a CSV
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} />

        {/* Mapping stage */}
        {importStage === "mapping" && (
          <div className="mt-4 rounded-[12px] border border-[#E8E0D4] bg-white p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-[12px] font-bold text-[#312B1E]">{importFileName}</div>
              <div className="text-[11px] text-[#8D8476]">{importRawRows.length.toLocaleString()} rows detected · nothing saved yet</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Date column", value: mapDate, set: setMapDate },
                { label: "Description column", value: mapName, set: setMapName },
                { label: "Amount column", value: mapAmount, set: setMapAmount },
              ].map((m) => (
                <div key={m.label}>
                  <label className={labelCls}>{m.label}</label>
                  <select value={m.value} onChange={(e) => m.set(Number(e.target.value))}
                    className="mt-1.5 w-full border border-[#E8E0D4] rounded-[10px] px-3 py-2.5 text-[12.5px] outline-none focus:border-[#F1622C]/60 bg-white text-[#312B1E]">
                    <option value={-1}>— select —</option>
                    {importHeaders.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 gap-2">
              <button onClick={resetImport} className="text-[11.5px] font-bold text-[#8D8476] hover:text-[#312B1E] transition-colors">Cancel</button>
              <button onClick={() => setImportStage("preview")} disabled={mapDate < 0 || mapName < 0 || mapAmount < 0}
                className="flex items-center gap-1.5 bg-[#312B1E] text-white px-4 py-2 rounded-[10px] text-[12px] font-bold hover:bg-black transition-all disabled:opacity-40">
                Preview →
              </button>
            </div>
          </div>
        )}

        {/* Preview stage */}
        {importPreview && (importStage === "preview" || importStage === "importing") && (
          <div className="mt-4 rounded-[12px] border border-[#E8E0D4] bg-white p-4">
            <div className="text-[12px] font-bold text-[#312B1E] mb-2">Preview — first movements</div>
            <div className="space-y-1.5">
              {importPreview.parsed.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] font-mono">
                  <span className="text-[#8D8476] w-[92px] shrink-0">
                    {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex-1 text-[#312B1E] truncate px-2">{p.name}</span>
                  <span className={p.type === "in" ? "text-[#287A55] font-bold" : "text-[#312B1E] font-bold"}>
                    {p.type === "in" ? "+" : "−"}{Math.abs(p.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {importPreview.parsed.length === 0 && (
                <p className="text-[11.5px] text-[#A84B3D]">No valid movements detected with this mapping — try different columns.</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1EADF] text-[11px] text-[#8D8476] flex-wrap gap-1">
              <span>{importPreview.parsed.length.toLocaleString()} valid · {importPreview.skipped.toLocaleString()} skipped</span>
              <span>{importPreview.parsed.filter((p) => p.type === "in").length} in · {importPreview.parsed.filter((p) => p.type === "out").length} out · amounts read as {settings.reporting_currency}</span>
            </div>
            <div className="flex items-center justify-between mt-4 gap-2">
              <button onClick={() => setImportStage("mapping")} disabled={importStage === "importing"}
                className="text-[11.5px] font-bold text-[#8D8476] hover:text-[#312B1E] transition-colors">← Adjust mapping</button>
              <button onClick={handleConfirmImport} disabled={importStage === "importing" || importPreview.parsed.length === 0}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-[10px] text-[12px] font-bold hover:brightness-110 transition-all disabled:opacity-50" style={{ background: "#F1622C" }}>
                {importStage === "importing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Teach WIC these movements
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {importStage === "done" && importResult && (
          <div className="mt-4 rounded-[12px] border border-[#CDE6D6] bg-[#E8F3EC] p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#287A55] shrink-0" />
              <p className="text-[12.5px] text-[#287A55] font-semibold leading-relaxed">
                WIC just learned {importResult.imported.toLocaleString()} movements
                {importResult.skipped > 0 ? ` (${importResult.skipped} skipped as duplicates or unreadable)` : ""}.
                The briefing reflects them immediately.
              </p>
            </div>
            <button onClick={resetImport} className="text-[11.5px] font-bold text-[#287A55] hover:underline shrink-0">Import another file</button>
          </div>
        )}
      </div>
    </section>
  );
}
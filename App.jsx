import { useState } from "react";

// In dev, Vite runs on 5173 and Flask on 5000.
// In production (Electron), Flask serves everything from 5000 so same origin.
const BACKEND = import.meta.env.DEV ? "http://localhost:5000" : "";

const C = {
  cognac:     "#6B3A2A",
  cognacDark: "#4e2a1e",
  cream:      "#F5EFE6",
  creamDark:  "#EDE3D6",
  ink:        "#1C1C1C",
  muted:      "#7A6A62",
  line:       "#E8DDD6",
  white:      "#FFFFFF",
  surface:    "#FDFAF7",
};

const uid    = () => Math.random().toString(36).slice(2, 8);
const n      = v  => parseFloat(v) || 0;
const fmtINR = val =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(val || 0);

// ── UI atoms ──────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
    textTransform: "uppercase", color: C.muted, marginBottom: 5 }}>{children}</div>
);

const Input = ({ style, ...props }) => (
  <input
    style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: "7px 10px",
      fontSize: 13, color: C.ink, background: C.white, width: "100%",
      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
      transition: "border-color 0.15s", ...style }}
    onFocus={e => (e.target.style.borderColor = C.cognac)}
    onBlur={e  => (e.target.style.borderColor = C.line)}
    {...props}
  />
);

const Btn = ({ children, variant = "primary", style, ...props }) => {
  const v = {
    primary: { background: C.cognac,      color: C.white,  border: "none" },
    ghost:   { background: "transparent", color: C.muted,  border: `1px solid ${C.line}` },
    cream:   { background: C.cream,       color: C.cognac, border: `1px solid ${C.creamDark}` },
  };
  return (
    <button style={{ borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 700,
      cursor: "pointer", letterSpacing: "0.05em", fontFamily: "inherit",
      transition: "opacity 0.15s", ...v[variant], ...style }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      {...props}>{children}</button>
  );
};

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      style={{ width: 36, height: 20, borderRadius: 10,
        background: checked ? C.cognac : C.line, position: "relative",
        transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3,
        width: 14, height: 14, borderRadius: "50%", background: C.white,
        transition: "left 0.2s" }} />
    </div>
    {label && <span style={{ fontSize: 11, color: C.muted }}>{checked ? "On" : "Off"}</span>}
  </label>
);

const SectionWrap = ({ title, enabled, onToggle, open, onOpenToggle, children, total }) => (
  <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10,
    marginBottom: 12, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 18px", background: enabled ? C.white : C.surface, cursor: "pointer" }}
      onClick={onOpenToggle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 3, height: 16, background: enabled ? C.cognac : C.line, borderRadius: 2 }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em",
          textTransform: "uppercase", color: enabled ? C.ink : C.muted }}>{title}</span>
        {total > 0 && enabled && (
          <span style={{ fontSize: 11, color: C.cognac, fontWeight: 600 }}>{fmtINR(total)}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={e => e.stopPropagation()}><Toggle checked={enabled} onChange={onToggle} label /></div>
        <span style={{ color: C.muted, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </div>
    </div>
    {open && enabled && (
      <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.line}` }}>{children}</div>
    )}
  </div>
);

const TH = ({ children, right }) => (
  <th style={{ padding: "7px 9px", textAlign: right ? "right" : "left", fontSize: 10,
    fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
    color: C.white, background: C.cognac, whiteSpace: "nowrap" }}>{children}</th>
);

const RemoveBtn = ({ onClick }) => (
  <button onClick={onClick}
    style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>✕</button>
);

// ── Fabric table ──────────────────────────────────────────────────────────────
function FabricTable({ rows, setRows }) {
  const update = (id, field, val) =>
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      const u = { ...r, [field]: val };
      u.singlePcCost = n(u.consumption) * n(u.ratePerMeter);
      return u;
    }));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>
          <TH>Fabric Name</TH><TH>Width</TH>
          <TH>Avg Consumption / pc</TH><TH right>Rate / Mtr (₹)</TH>
          <TH right>Single Pc Cost (₹)</TH><TH></TH>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ background: i%2===0 ? C.white : C.surface }}>
              <td style={{ padding: "5px 7px" }}><Input value={r.name} onChange={e => update(r.id,"name",e.target.value)} placeholder="Fabric name" /></td>
              <td style={{ padding: "5px 7px" }}><Input value={r.width} onChange={e => update(r.id,"width",e.target.value)} placeholder='58"' /></td>
              <td style={{ padding: "5px 7px" }}><Input value={r.consumption} type="number" onChange={e => update(r.id,"consumption",e.target.value)} placeholder="0.00" /></td>
              <td style={{ padding: "5px 7px" }}><Input value={r.ratePerMeter} type="number" onChange={e => update(r.id,"ratePerMeter",e.target.value)} placeholder="0.00" /></td>
              <td style={{ padding: "5px 9px", fontWeight: 700, color: C.cognac, textAlign: "right", whiteSpace: "nowrap" }}>{fmtINR(r.singlePcCost)}</td>
              <td style={{ padding: "5px 7px" }}><RemoveBtn onClick={() => setRows(rows.filter(x => x.id !== r.id))} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10 }}>
        <Btn variant="cream" onClick={() => setRows([...rows, { id: uid(), name: "", width: "", consumption: "", ratePerMeter: "", singlePcCost: 0 }])}>
          + Add Fabric
        </Btn>
      </div>
    </div>
  );
}

// ── Trims table ───────────────────────────────────────────────────────────────
// Unit field added — if left blank, qty × rate still works (e.g. put 1 for fusing)
// Unit is free text: pcs / mtr / yd / set / lot etc.
function TrimsTable({ rows, setRows }) {
  const update = (id, field, val) =>
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      const u = { ...r, [field]: val };
      u.cost = n(u.qty) * n(u.rate);
      return u;
    }));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>
          <TH>Description</TH>
          <TH>Qty / Avg</TH>
          <TH>Unit</TH>
          <TH right>Rate / Unit (₹)</TH>
          <TH right>Cost (₹)</TH>
          <TH></TH>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ background: i%2===0 ? C.white : C.surface }}>
              <td style={{ padding: "5px 7px", minWidth: 170 }}>
                <Input value={r.description} onChange={e => update(r.id,"description",e.target.value)} placeholder="e.g. Button, Fusing, Zipper..." />
              </td>
              <td style={{ padding: "5px 7px", width: 90 }}>
                <Input value={r.qty} type="number" onChange={e => update(r.id,"qty",e.target.value)} placeholder="0" />
              </td>
              <td style={{ padding: "5px 7px", width: 80 }}>
                {/* Free text — pcs / mtr / yd / set / lot etc. For rough cost (fusing) just put 1 in qty */}
                <Input value={r.unit} onChange={e => update(r.id,"unit",e.target.value)} placeholder="pcs" />
              </td>
              <td style={{ padding: "5px 7px", width: 120 }}>
                <Input value={r.rate} type="number" onChange={e => update(r.id,"rate",e.target.value)} placeholder="0.00" />
              </td>
              <td style={{ padding: "5px 9px", fontWeight: 700, color: C.cognac, textAlign: "right", whiteSpace: "nowrap" }}>
                {fmtINR(r.cost)}
              </td>
              <td style={{ padding: "5px 7px" }}>
                <RemoveBtn onClick={() => setRows(rows.filter(x => x.id !== r.id))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        <Btn variant="cream" onClick={() => setRows([...rows, { id: uid(), description: "", qty: "", unit: "pcs", rate: "", cost: 0 }])}>
          + Add Trim
        </Btn>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontStyle: "italic" }}>
        Tip: For items like fusing where you have a rough cost, enter 1 in Qty and the total cost in Rate.
      </div>
    </div>
  );
}

// ── Simple rate table ─────────────────────────────────────────────────────────
function SimpleRateTable({ rows, setRows, placeholder = "Description" }) {
  const update = (id, field, val) => setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr><TH>{placeholder}</TH><TH right>Rate per pc (₹)</TH><TH></TH></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ background: i%2===0 ? C.white : C.surface }}>
              <td style={{ padding: "5px 7px" }}><Input value={r.description} onChange={e => update(r.id,"description",e.target.value)} placeholder={placeholder} /></td>
              <td style={{ padding: "5px 7px", width: 150 }}><Input value={r.rate} type="number" onChange={e => update(r.id,"rate",e.target.value)} placeholder="0.00" /></td>
              <td style={{ padding: "5px 7px" }}><RemoveBtn onClick={() => setRows(rows.filter(x => x.id !== r.id))} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        <Btn variant="cream" onClick={() => setRows([...rows, { id: uid(), description: "", rate: "" }])}>+ Add Row</Btn>
      </div>
    </div>
  );
}

const SingleRate = ({ label, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ flex: 1, maxWidth: 280 }}>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00" />
    </div>
    {value && <div style={{ fontWeight: 700, color: C.cognac, marginTop: 14 }}>{fmtINR(n(value))}</div>}
  </div>
);

// ── Cost summary ──────────────────────────────────────────────────────────────
function CostSummary({ totals, enabled, overheadPct, marginPct, exRate }) {
  const active = key => enabled[key] ? totals[key] : 0;
  const keys   = ["fabricShell","lining","trims","embellishment","cmt","cutRecut",
                  "washing","labels","packing","courierTest"];
  const subtotal   = keys.reduce((s, k) => s + active(k), 0);
  const overhead   = subtotal * n(overheadPct) / 100;
  const marginBase = subtotal + overhead;
  const margin     = marginBase * n(marginPct) / 100;
  const total      = marginBase + margin;
  const totalUSD   = n(exRate) > 0 ? total / n(exRate) : null;

  const Row = ({ label, val, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
      borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 12, color: bold ? C.ink : C.muted, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 500, color: bold ? C.cognac : C.ink }}>{fmtINR(val)}</span>
    </div>
  );

  const sections = [
    ["Fabric (Shell)",      "fabricShell"],
    ["Fabric (Lining)",     "lining"],
    ["Trims & Accessories", "trims"],
    ["Embellishment",       "embellishment"],
    ["CMT",                 "cmt"],
    ["Cut & Recut",         "cutRecut"],
    ["Washing / Finishing", "washing"],
    ["Labels & Tags",       "labels"],
    ["Packing & Material",  "packing"],
    ["Courier & Testing",   "courierTest"],
  ];

  return (
    <div style={{ position: "sticky", top: 20 }}>
      <div style={{ background: C.white, border: `1.5px solid ${C.cognac}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: C.cognac, padding: "12px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.cream }}>Cost Summary</div>
          <div style={{ fontSize: 10, color: "#c4a090", marginTop: 2 }}>Single Piece · INR</div>
        </div>
        <div style={{ padding: "12px 18px" }}>
          {sections.filter(([, k]) => enabled[k] && totals[k] > 0).map(([label, k]) => (
            <Row key={k} label={label} val={totals[k]} />
          ))}
          <div style={{ margin: "5px 0" }} />
          <Row label={`Overhead (${overheadPct || 0}%)`} val={overhead} />
          <Row label={`Margin (${marginPct || 0}%)`}     val={margin} />
          <Row label="Total Cost (INR)" val={total} bold />
        </div>
        {totalUSD !== null && (
          <div style={{ padding: "12px 18px", background: C.cream, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Converted to USD</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.cognac }}>${totalUSD.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>@ ₹{exRate} = 1 USD</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PDF upload zone ───────────────────────────────────────────────────────────
// Only extracts style number + front image. No BOM import.
function PdfUploadZone({ onExtracted }) {
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [preview,  setPreview]  = useState(null);

  const sendPdf = async file => {
    setLoading(true); setError(null);
    try {
      const form = new FormData();
      form.append("pdf", file);
      const res  = await fetch(`${BACKEND}/extract`, { method: "POST", body: form, mode: "cors" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setPreview(data);
    } catch (e) {
      setError(`${e.message} — make sure the backend is running (python app.py)`);
    } finally { setLoading(false); }
  };

  if (preview) return (
    <div style={{ background: C.white, border: `1.5px solid ${C.cognac}`, borderRadius: 10,
      padding: "16px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em",
        textTransform: "uppercase", color: C.cognac, marginBottom: 10 }}>
        ✓ Tech Pack Read — Review Before Import
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <Label>Style Number</Label>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{preview.style_number}</div>
        </div>
        {preview.front_image && (
          <img src={`data:image/png;base64,${preview.front_image}`} alt="Front"
            style={{ height: 90, borderRadius: 6, border: `1px solid ${C.line}` }} />
        )}
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
        Style number and front image will be imported. Fill in all costs manually.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="primary" onClick={() => { onExtracted(preview); setPreview(null); }}>✓ Import</Btn>
        <Btn variant="ghost" onClick={() => setPreview(null)}>Discard</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10,
      padding: "16px 20px", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em",
        textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>Import from Tech Pack</div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") sendPdf(f); }}
        onClick={() => document.getElementById("pdf-input").click()}
        style={{ border: `2px dashed ${dragging ? C.cognac : C.line}`, borderRadius: 8,
          padding: "20px", textAlign: "center", cursor: "pointer",
          background: dragging ? C.cream : C.surface, transition: "all 0.2s" }}>
        <div style={{ fontSize: 24, marginBottom: 5 }}>📄</div>
        {loading
          ? <p style={{ color: C.muted, fontSize: 13 }}>Reading tech pack…</p>
          : <><p style={{ color: C.ink, fontWeight: 600, fontSize: 13 }}>Drop tech pack PDF here</p>
             <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Extracts style number &amp; front image only</p></>}
        {error && <p style={{ color: "#e05c5c", marginTop: 8, fontSize: 12 }}>⚠ {error}</p>}
      </div>
      <input id="pdf-input" type="file" accept="application/pdf" style={{ display: "none" }}
        onChange={e => e.target.files[0] && sendPdf(e.target.files[0])} />
    </div>
  );
}

// ── Excel export via backend ──────────────────────────────────────────────────
async function exportExcel(payload) {
  try {
    const res = await fetch(`${BACKEND}/export-excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Export failed");
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${payload.header?.styleNo || "proto"}_costing_CC.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`Export error: ${e.message}\nMake sure the backend is running.`);
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────
const initFabric = () => ({ id: uid(), name: "", width: "", consumption: "", ratePerMeter: "", singlePcCost: 0 });
const initTrim   = () => ({ id: uid(), description: "", qty: "", unit: "pcs", rate: "", cost: 0 });
const initSimple = () => ({ id: uid(), description: "", rate: "" });

export default function App() {
  const [header, setHeader] = useState({
    styleNo: "", styleName: "", season: "", buyer: "",
    garmentCategory: "", date: new Date().toISOString().slice(0,10),
    totalPieces: "", exRate: "",
  });

  const [fabricShell,   setFabricShell]   = useState([initFabric()]);
  const [lining,        setLining]        = useState([initFabric()]);
  const [trims,         setTrims]         = useState([initTrim()]);
  const [embellishment, setEmbellishment] = useState([initSimple()]);
  const [cmt,           setCmt]           = useState("");
  const [cutRecut,      setCutRecut]      = useState("");
  const [washing,       setWashing]       = useState([initSimple()]);
  const [labels,        setLabels]        = useState([initSimple()]);
  const [packing,       setPacking]       = useState([initSimple()]);
  const [courierTest,   setCourierTest]   = useState("");
  const [overheadPct,   setOverheadPct]   = useState("10");
  const [marginPct,     setMarginPct]     = useState("15");
  const [frontImg,      setFrontImg]      = useState(null);

  const [enabled, setEnabled] = useState({
    fabricShell: true, lining: false, trims: true, embellishment: false,
    cmt: true, cutRecut: false, washing: true, labels: true, packing: true, courierTest: true,
  });
  const [open, setOpen] = useState({
    fabricShell: true, lining: false, trims: true, embellishment: false,
    cmt: true, cutRecut: false, washing: false, labels: false, packing: false, courierTest: false,
  });

  const [view,    setView]    = useState("form");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cc_proto_history") || "[]"); }
    catch { return []; }
  });

  const totals = {
    fabricShell:   fabricShell.reduce((s, r) => s + (r.singlePcCost || 0), 0),
    lining:        lining.reduce((s, r) => s + (r.singlePcCost || 0), 0),
    trims:         trims.reduce((s, r) => s + (r.cost || 0), 0),
    embellishment: embellishment.reduce((s, r) => s + n(r.rate), 0),
    cmt:           n(cmt),
    cutRecut:      n(cutRecut),
    washing:       washing.reduce((s, r) => s + n(r.rate), 0),
    labels:        labels.reduce((s, r) => s + n(r.rate), 0),
    packing:       packing.reduce((s, r) => s + n(r.rate), 0),
    courierTest:   n(courierTest),
  };

  // PDF import — style number + image only
  const handleExtracted = data => {
    setHeader(p => ({ ...p, styleNo: data.style_number || p.styleNo }));
    if (data.front_image) setFrontImg(data.front_image);
  };

  const save = () => {
    const entry = { header, fabricShell, lining, trims, embellishment, cmt, cutRecut,
      washing, labels, packing, courierTest, overheadPct, marginPct, enabled,
      savedAt: new Date().toISOString() };
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem("cc_proto_history", JSON.stringify(updated));
    alert("Costing saved!");
  };

  const loadEntry = e => {
    setHeader(e.header); setFabricShell(e.fabricShell); setLining(e.lining);
    setTrims(e.trims); setEmbellishment(e.embellishment); setCmt(e.cmt);
    setCutRecut(e.cutRecut || ""); setWashing(e.washing); setLabels(e.labels);
    setPacking(e.packing); setCourierTest(e.courierTest);
    setOverheadPct(e.overheadPct); setMarginPct(e.marginPct);
    setEnabled(e.enabled); setView("form");
  };

  const reset = () => {
    if (!window.confirm("Start new costing? Unsaved data will be lost.")) return;
    setHeader({ styleNo: "", styleName: "", season: "", buyer: "", garmentCategory: "",
      date: new Date().toISOString().slice(0,10), totalPieces: "", exRate: "" });
    setFabricShell([initFabric()]); setLining([initFabric()]);
    setTrims([initTrim()]); setEmbellishment([initSimple()]);
    setCmt(""); setCutRecut(""); setWashing([initSimple()]);
    setLabels([initSimple()]); setPacking([initSimple()]);
    setCourierTest(""); setOverheadPct("10"); setMarginPct("15"); setFrontImg(null);
  };

  const tog  = key => setEnabled(p => ({ ...p, [key]: !p[key] }));
  const togO = key => setOpen(p => ({ ...p, [key]: !p[key] }));

  const H = (label, field, type = "text") => (
    <div key={field}>
      <Label>{label}</Label>
      <Input type={type} value={header[field]}
        onChange={e => setHeader(p => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  const exportPayload = {
    header, enabled, totals, overheadPct, marginPct,
    frontImageB64: frontImg,
    sections: { fabricShell, lining, trims, embellishment, cmt, cutRecut,
                washing, labels, packing, courierTest },
  };

  return (
    <div style={{ minHeight: "100vh", background: C.surface, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: C.cognacDark, padding: "0 28px", display: "flex",
        alignItems: "center", justifyContent: "space-between", height: 54,
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px #0003" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: C.cream, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 12, color: C.cognac }}>CC</div>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 13 }}>Contemporary Classique LLP</div>
            <div style={{ color: "#c4a090", fontSize: 10, letterSpacing: "0.08em" }}>PROTO COSTING</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["History", () => setView(v => v === "history" ? "form" : "history")],
            ["New", reset], ["Save", save]].map(([label, fn]) => (
            <Btn key={label} variant="ghost"
              style={{ color: "#e8ddd6", borderColor: "#ffffff25", fontSize: 11 }}
              onClick={fn}>{label}</Btn>
          ))}
          <Btn variant="cream" style={{ fontSize: 11 }} onClick={() => exportExcel(exportPayload)}>
            ↓ Export Excel
          </Btn>
        </div>
      </div>

      {/* History */}
      {view === "history" && (
        <div style={{ maxWidth: 760, margin: "32px auto", padding: "0 20px" }}>
          <h2 style={{ fontWeight: 800, color: C.cognac, marginBottom: 16, fontSize: 17 }}>Saved Costings</h2>
          {!history.length
            ? <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>No saved costings yet.</div>
            : history.map((h, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10,
                padding: "14px 18px", marginBottom: 10, display: "flex",
                justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{h.header.styleNo || "Untitled"}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {h.header.buyer} · {h.header.season} · {new Date(h.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <Btn variant="primary" style={{ fontSize: 11 }} onClick={() => loadEntry(h)}>Load</Btn>
              </div>
            ))
          }
        </div>
      )}

      {/* Form */}
      {view === "form" && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 20px",
          display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
          <div>
            <PdfUploadZone onExtracted={handleExtracted} />

            {/* Order details */}
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10,
              padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em",
                textTransform: "uppercase", color: C.cognac, marginBottom: 14,
                display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, background: C.cognac, borderRadius: 2 }} />
                Order Details
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {frontImg && (
                  <div style={{ flexShrink: 0 }}>
                    <Label>Front View</Label>
                    <img src={`data:image/png;base64,${frontImg}`} alt="Front"
                      style={{ height: 100, borderRadius: 7, border: `1px solid ${C.line}`, marginTop: 4 }} />
                  </div>
                )}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {H("Style No.", "styleNo")}
                  {H("Style Name", "styleName")}
                  {H("Season", "season")}
                  {H("Buyer", "buyer")}
                  {H("Garment Category", "garmentCategory")}
                  {H("Date", "date", "date")}
                  <div>
                    <Label>Total Pieces (reference only)</Label>
                    <Input type="number" value={header.totalPieces}
                      onChange={e => setHeader(p => ({ ...p, totalPieces: e.target.value }))}
                      placeholder="Order qty" />
                  </div>
                  <div>
                    <Label>Exchange Rate (₹ per 1 USD)</Label>
                    <Input type="number" value={header.exRate}
                      onChange={e => setHeader(p => ({ ...p, exRate: e.target.value }))}
                      placeholder="e.g. 84.50" />
                  </div>
                </div>
              </div>
            </div>

            <SectionWrap title="Fabric — Shell" enabled={enabled.fabricShell}
              onToggle={() => tog("fabricShell")} open={open.fabricShell}
              onOpenToggle={() => togO("fabricShell")} total={totals.fabricShell}>
              <FabricTable rows={fabricShell} setRows={setFabricShell} />
            </SectionWrap>

            <SectionWrap title="Fabric — Lining" enabled={enabled.lining}
              onToggle={() => tog("lining")} open={open.lining}
              onOpenToggle={() => togO("lining")} total={totals.lining}>
              <FabricTable rows={lining} setRows={setLining} />
            </SectionWrap>

            <SectionWrap title="Trims & Accessories" enabled={enabled.trims}
              onToggle={() => tog("trims")} open={open.trims}
              onOpenToggle={() => togO("trims")} total={totals.trims}>
              <TrimsTable rows={trims} setRows={setTrims} />
            </SectionWrap>

            <SectionWrap title="Embellishment / Embroidery" enabled={enabled.embellishment}
              onToggle={() => tog("embellishment")} open={open.embellishment}
              onOpenToggle={() => togO("embellishment")} total={totals.embellishment}>
              <SimpleRateTable rows={embellishment} setRows={setEmbellishment} placeholder="Type / Placement" />
            </SectionWrap>

            <SectionWrap title="CMT" enabled={enabled.cmt}
              onToggle={() => tog("cmt")} open={open.cmt}
              onOpenToggle={() => togO("cmt")} total={totals.cmt}>
              <SingleRate label="CMT Rate — Single Piece (₹)" value={cmt} onChange={setCmt} />
            </SectionWrap>

            <SectionWrap title="Cut & Recut" enabled={enabled.cutRecut}
              onToggle={() => tog("cutRecut")} open={open.cutRecut}
              onOpenToggle={() => togO("cutRecut")} total={totals.cutRecut}>
              <SingleRate label="Cut & Recut Rate — Single Piece (₹)" value={cutRecut} onChange={setCutRecut} />
            </SectionWrap>

            <SectionWrap title="Washing / Finishing" enabled={enabled.washing}
              onToggle={() => tog("washing")} open={open.washing}
              onOpenToggle={() => togO("washing")} total={totals.washing}>
              <SimpleRateTable rows={washing} setRows={setWashing} placeholder="Wash type" />
            </SectionWrap>

            <SectionWrap title="Labels & Tags" enabled={enabled.labels}
              onToggle={() => tog("labels")} open={open.labels}
              onOpenToggle={() => togO("labels")} total={totals.labels}>
              <SimpleRateTable rows={labels} setRows={setLabels} placeholder="Label / tag name" />
            </SectionWrap>

            <SectionWrap title="Packing & Material" enabled={enabled.packing}
              onToggle={() => tog("packing")} open={open.packing}
              onOpenToggle={() => togO("packing")} total={totals.packing}>
              <SimpleRateTable rows={packing} setRows={setPacking} placeholder="Packing item" />
            </SectionWrap>

            <SectionWrap title="Courier & Testing" enabled={enabled.courierTest}
              onToggle={() => tog("courierTest")} open={open.courierTest}
              onOpenToggle={() => togO("courierTest")} total={totals.courierTest}>
              <SingleRate label="Courier & Testing — Combined Rate per pc (₹)" value={courierTest} onChange={setCourierTest} />
            </SectionWrap>

            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 10,
              padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em",
                textTransform: "uppercase", color: C.cognac, marginBottom: 14,
                display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 3, height: 16, background: C.cognac, borderRadius: 2 }} />
                Overhead & Profit Margin
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 320 }}>
                <div><Label>Overhead %</Label>
                  <Input type="number" value={overheadPct} onChange={e => setOverheadPct(e.target.value)} placeholder="10" /></div>
                <div><Label>Profit Margin %</Label>
                  <Input type="number" value={marginPct} onChange={e => setMarginPct(e.target.value)} placeholder="15" /></div>
              </div>
            </div>
          </div>

          <CostSummary totals={totals} enabled={enabled}
            overheadPct={overheadPct} marginPct={marginPct} exRate={header.exRate} />
        </div>
      )}
    </div>
  );
}

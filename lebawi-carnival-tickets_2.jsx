import { useState, useEffect, useRef } from "react";

function generateQRCodeSVG(text, size = 160) {
  const hash = (str) => { let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; } return Math.abs(h); };
  const seed = hash(text), gridSize = 21, cellSize = size / gridSize, cells = [];
  const rng = (n) => { const x = Math.sin(seed + n) * 10000; return x - Math.floor(x); };
  const addFinder = (ox, oy) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { if (y === 0 || y === 6 || x === 0 || x === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) cells.push({ x: ox + x, y: oy + y }); } };
  addFinder(0, 0); addFinder(gridSize - 7, 0); addFinder(0, gridSize - 7);
  for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) { const inF = (x < 8 && y < 8) || (x >= gridSize - 8 && y < 8) || (x < 8 && y >= gridSize - 8); if (!inF && rng(y * gridSize + x) > 0.5) cells.push({ x, y }); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white" rx="4"/>${cells.map(c => `<rect x="${c.x * cellSize}" y="${c.y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0F0A1E"/>`).join("")}</svg>`;
}

const SK = "lebawi-carnival-tickets";
function loadData() { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : { tickets: [], nextId: 1001 }; } catch { return { tickets: [], nextId: 1001 }; } }
function saveData(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }
function genCode(id) { const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = "LBW-"; const s = id * 2654435761; for (let i = 0; i < 6; i++) c += ch[(s >> (i * 5)) & 31 % ch.length]; return c + "-" + id; }

const C = { bg: "#0A0712", sf: "#130F1F", card: "#1A1528", bd: "#2A2240", bdL: "#3D3260", pur: "#6B3FA0", purD: "#4A2670", gold: "#C9A84C", goldD: "rgba(201,168,76,0.12)", tx: "#E8E4F0", txM: "#9B93AD", txD: "#6B6280", wh: "#FFFFFF", grn: "#3DD68C", grnD: "rgba(61,214,140,0.10)", red: "#E85454", redD: "rgba(232,84,84,0.10)", yel: "#E8B84C", yelD: "rgba(232,184,76,0.10)" };

export default function App() {
  const [pg, setPg] = useState("home");
  const [data, setData] = useState(loadData());
  const [auth, setAuth] = useState(false);
  const [notif, setNotif] = useState(null);
  useEffect(() => { saveData(data); }, [data]);
  const notify = (m, t = "success") => { setNotif({ m, t }); setTimeout(() => setNotif(null), 3500); };
  const addTickets = (tks) => setData(p => ({ ...p, tickets: [...p.tickets, ...tks], nextId: p.nextId + tks.length }));
  const confirmPay = (id, groupId) => setData(p => ({ ...p, tickets: p.tickets.map(t => (groupId ? t.groupId === groupId : t.id === id) ? { ...t, status: "confirmed" } : t) }));
  const validate = (code) => {
    const tk = data.tickets.find(t => genCode(t.id) === code || t.id.toString() === code);
    if (!tk) return { ok: false, msg: "Ticket not found" };
    if (tk.status === "pending") return { ok: false, msg: "Payment not confirmed yet", tk };
    if (tk.scannedAt) return { ok: false, msg: `Already scanned at ${new Date(tk.scannedAt).toLocaleTimeString()}`, tk };
    setData(p => ({ ...p, tickets: p.tickets.map(t => t.id === tk.id ? { ...t, scannedAt: new Date().toISOString() } : t) }));
    return { ok: true, msg: "Entry approved!", tk };
  };

  return (
    <div style={s.app}>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {notif && <div style={{ ...s.notif, background: notif.t === "success" ? C.grn : C.red, color: C.bg }}>{notif.m}</div>}
      {pg === "home" && <Home go={setPg} />}
      {pg === "buy" && <Buy go={setPg} add={addTickets} notify={notify} data={data} />}
      {pg === "admin" && <Admin go={setPg} data={data} confirm={confirmPay} auth={auth} setAuth={setAuth} notify={notify} />}
      {pg === "scan" && <Scan go={setPg} validate={validate} notify={notify} />}
      {pg === "myticket" && <MyTicket go={setPg} data={data} notify={notify} />}
    </div>
  );
}

function Home({ go }) {
  return (
    <div style={s.home}>
      <div style={s.homeGrain} />
      <div style={s.hL1} /><div style={s.hL2} /><div style={s.hL3} />
      <div style={s.hContent}>
        <div style={s.hBadge}>LEBAWI INTERNATIONAL ACADEMY</div>
        <h1 style={s.hTitle}>CARNIVAL</h1>
        <div style={s.hDiv}><div style={s.hDivLine} /><div style={s.hDivDia}>◆</div><div style={s.hDivLine} /></div>
        <p style={s.hYear}>2026</p>
        <p style={s.hDesc}>An evening of celebration, community, and unforgettable memories</p>
        <div style={s.hPrice}><span style={s.hPrL}>ENTRY</span><span style={s.hPrA}>700</span><span style={s.hPrC}>BIRR</span></div>
        <div style={s.hBtns}>
          <button style={s.btn1} onClick={() => go("buy")} className="bh">Purchase Ticket</button>
          <button style={s.btn2} onClick={() => go("myticket")} className="bh">View My Ticket</button>
        </div>
        <div style={s.hLinks}>
          <button style={s.fLink} onClick={() => go("admin")}>Admin Dashboard</button>
          <span style={{ color: C.bdL }}>|</span>
          <button style={s.fLink} onClick={() => go("scan")}>Gate Scanner</button>
        </div>
      </div>
    </div>
  );
}

function Nav({ go, title }) {
  return <div style={s.nav}><button style={s.navBack} onClick={() => go("home")}>← Back</button><span style={s.navT}>{title}</span><div style={{ width: 60 }} /></div>;
}
function Fld({ label, req, opt, children }) {
  return <div style={{ marginBottom: 16 }}>{label && <label style={s.label}>{label}{req && <span style={{ color: C.gold }}> *</span>}{opt && <span style={{ color: C.txD, fontWeight: 400 }}> (optional)</span>}</label>}{children}</div>;
}
function IRow({ label, value, badge }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.bd}` }}><span style={{ fontSize: 13, color: C.txM }}>{label}</span>{badge ? <span style={{ ...s.badge, ...(badge === "confirmed" ? s.bGrn : s.bYel) }}>{value}</span> : <span style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>{value}</span>}</div>;
}
function Stat({ value, label, color }) {
  return <div style={s.stat}><div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Cormorant Garamond', serif", color: color || C.tx }}>{value}</div><div style={{ fontSize: 10, color: C.txM, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div></div>;
}

function Buy({ go, add, notify, data }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", quantity: 1, paymentMethod: "", paymentScreenshot: null, screenshotName: "" });
  const [done, setDone] = useState(null);
  const ref = useRef(null);

  const TICKET_CAP = 1000;
  const soldTickets = data.tickets.length;

  const submit = () => {
    if (!f.name.trim() || !f.phone.trim()) return notify("Please fill in name and phone", "error");
    if (!f.paymentMethod) return notify("Select a payment method", "error");
    if (!f.paymentScreenshot) return notify("Upload payment screenshot", "error");
    if (soldTickets + f.quantity > TICKET_CAP) return notify(soldTickets >= TICKET_CAP ? "Sorry, tickets are sold out!" : `Only ${TICKET_CAP - soldTickets} tickets remaining`, "error");
    const groupId = `g-${Date.now()}`;
    const base = { name: f.name, phone: f.phone, email: f.email, paymentMethod: f.paymentMethod, paymentScreenshot: f.paymentScreenshot, screenshotName: f.screenshotName, status: "pending", createdAt: new Date().toISOString(), groupId, groupTotal: f.quantity, quantity: 1, totalAmount: 700 };
    const newTickets = Array.from({ length: f.quantity }, (_, i) => ({ ...base, id: data.nextId + i, ticketIndex: i + 1 }));
    add(newTickets);
    setDone(newTickets.map(tk => ({ ...tk, code: genCode(tk.id) })));
    notify("Ticket reserved! Awaiting verification.");
  };

  if (done) return (
    <div style={s.pg}><Nav go={go} title="Ticket Reserved" />
      <div style={s.card}>
        <div style={s.okCircle}>✓</div>
        <h2 style={s.cH}>Reservation Complete</h2>
        <p style={s.cS}>{done.length > 1 ? `${done.length} tickets reserved.` : "Your ticket is reserved."} An admin will verify your payment shortly.</p>
        {done.map((tk, i) => (
          <div key={tk.id} style={{ ...s.iBox, marginBottom: i < done.length - 1 ? 12 : 0 }}>
            <div style={s.iBoxH}><div style={s.iBoxT}>LEBAWI CARNIVAL{done.length > 1 ? ` — Ticket ${i + 1} of ${done.length}` : ""}</div><div style={s.iBoxC}>{tk.code}</div></div>
            <div style={s.iBoxD} />
            <IRow label="Name" value={tk.name} />
            {i === 0 && <><IRow label="Quantity" value={done.length} /><IRow label="Total" value={`${done.length * 700} Birr`} /><IRow label="Payment" value={tk.paymentMethod === "cbe" ? "CBE" : "Telebirr"} /></>}
            <IRow label="Status" badge="pending" value="Awaiting Verification" />
          </div>
        ))}
        <button style={{ ...s.btn1, width: "100%", marginTop: 12 }} onClick={() => go("home")} className="bh">Return Home</button>
      </div>
    </div>
  );

  return (
    <div style={s.pg}><Nav go={go} title="Purchase Ticket" />
      <div style={s.card}>
        <div style={s.fmH}><div><h2 style={s.fmT}>Lebawi Carnival</h2><p style={s.fmS}>Entry Ticket — 700 Birr</p></div><div style={s.fmBadge}>2026</div></div>
        <div style={s.divT} />
        <Fld label="Full Name" req><input style={s.inp} placeholder="Enter your full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Fld>
        <Fld label="Phone Number" req><input style={s.inp} placeholder="+251 9XX XXX XXXX" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Fld>
        <Fld label="Email" opt><input style={s.inp} placeholder="your@email.com" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Fld>
        <Fld label="Number of Tickets">
          <div style={s.qR}><button style={s.qB} onClick={() => setF({ ...f, quantity: Math.max(1, f.quantity - 1) })}>−</button><span style={s.qN}>{f.quantity}</span><button style={s.qB} onClick={() => setF({ ...f, quantity: Math.min(10, f.quantity + 1) })}>+</button></div>
        </Fld>
        <div style={s.totBar}><span style={s.totL}>Total</span><span style={s.totA}>{f.quantity * 700} Birr</span></div>

        <div style={s.secH}><div style={s.secL} /><span style={s.secT}>Payment</span><div style={s.secL} /></div>
        <p style={s.payH}>Transfer <strong style={{ color: C.gold }}>{f.quantity * 700} Birr</strong> to one of the accounts below, then upload your confirmation screenshot.</p>

        <div style={{ ...s.payO, ...(f.paymentMethod === "cbe" ? s.payOA : {}) }} onClick={() => setF({ ...f, paymentMethod: "cbe" })}>
          <div style={s.payOL}><div style={{ ...s.radio, ...(f.paymentMethod === "cbe" ? s.radioA : {}) }}>{f.paymentMethod === "cbe" && <div style={s.radioD} />}</div><div><div style={s.payN}>Commercial Bank of Ethiopia</div><div style={s.payAc}>Account: XXXX XXXX XXXX</div><div style={s.payHo}>Name: — (to be updated)</div></div></div><span style={s.payI}>🏦</span>
        </div>
        <div style={{ ...s.payO, ...(f.paymentMethod === "telebirr" ? s.payOA : {}) }} onClick={() => setF({ ...f, paymentMethod: "telebirr" })}>
          <div style={s.payOL}><div style={{ ...s.radio, ...(f.paymentMethod === "telebirr" ? s.radioA : {}) }}>{f.paymentMethod === "telebirr" && <div style={s.radioD} />}</div><div><div style={s.payN}>Telebirr</div><div style={s.payAc}>Phone: XXXX XXX XXXX</div><div style={s.payHo}>Name: — (to be updated)</div></div></div><span style={s.payI}>📱</span>
        </div>

        <div style={s.secH}><div style={s.secL} /><span style={s.secT}>Proof of Payment</span><div style={s.secL} /></div>
        <input type="file" accept="image/*" ref={ref} style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (!file) return; if (file.size > 5e6) return notify("Max 5MB", "error"); const r = new FileReader(); r.onload = ev => setF({ ...f, paymentScreenshot: ev.target.result, screenshotName: file.name }); r.readAsDataURL(file); }} />
        {!f.paymentScreenshot ? (
          <div style={s.upBox} onClick={() => ref.current?.click()}><div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>📤</div><div style={s.upTx}>Tap to upload screenshot</div><div style={s.upHint}>PNG, JPG — max 5MB</div></div>
        ) : (
          <div style={s.upDone}><img src={f.paymentScreenshot} alt="proof" style={s.upImg} /><div style={{ flex: 1 }}><div style={s.upName}>{f.screenshotName}</div><button style={s.upRm} onClick={() => { setF({ ...f, paymentScreenshot: null, screenshotName: "" }); if (ref.current) ref.current.value = ""; }}>Remove</button></div></div>
        )}
        <button style={{ ...s.btn1, width: "100%", marginTop: 8 }} onClick={submit} className="bh">Submit & Reserve Ticket</button>
      </div>
    </div>
  );
}

function MyTicket({ go, data, notify }) {
  const [q, setQ] = useState("");
  const [tks, setTks] = useState([]);
  const find = () => {
    const v = q.trim().toLowerCase();
    if (!v) return notify("Please enter a name, phone, or ticket code", "error");
    const results = data.tickets.filter(t => t.phone.includes(v) || t.name.toLowerCase().includes(v) || genCode(t.id).toLowerCase().includes(v));
    results.length > 0 ? setTks(results) : notify("No ticket found", "error");
  };

  return (
    <div style={s.pg}><Nav go={go} title="My Ticket" />
      <div style={s.card}>
        {tks.length === 0 ? (<><h2 style={s.cH}>Find Your Ticket</h2><p style={s.cS}>Search by name, phone, or ticket code</p><Fld label=""><input style={s.inp} placeholder="Name, phone, or code..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} /></Fld><button style={{ ...s.btn1, width: "100%" }} onClick={find} className="bh">Search</button></>) : (
          <div id="printable-ticket">
            {tks.length > 1 && <p style={{ textAlign: "center", fontSize: 13, color: C.txM, marginBottom: 16 }}>{tks.length} tickets found</p>}
            {tks.map((tk, i) => {
              const code = genCode(tk.id);
              const qr = generateQRCodeSVG(code, 160);
              return (
                <div key={tk.id} style={{ textAlign: "center", marginBottom: i < tks.length - 1 ? 24 : 0 }}>
                  {tks.length > 1 && <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Ticket {i + 1} of {tks.length}</div>}
                  <div style={s.tkLbl}>LEBAWI CARNIVAL 2026</div><div style={s.tkSub}>Entry Ticket</div>
                  <div style={s.tkDiv}>{[...Array(40)].map((_, j) => <span key={j} style={s.tkDot} />)}</div>
                  <div style={{ padding: 12, background: "white", borderRadius: 10, display: "inline-block", marginBottom: 12 }}><div dangerouslySetInnerHTML={{ __html: qr }} /></div>
                  <div style={s.tkCode}>{code}</div>
                  <div style={{ textAlign: "left", margin: "16px 0" }}><IRow label="Name" value={tk.name} /><IRow label="Status" badge={tk.status} value={tk.status === "confirmed" ? "Confirmed" : "Pending"} /></div>
                  {i < tks.length - 1 && <div style={{ height: 1, background: C.bd, margin: "16px 0" }} />}
                </div>
              );
            })}
            <p style={{ fontSize: 11, color: C.txD, marginBottom: 16, textAlign: "center" }}>Present each QR code at the gate for entry</p>
            <div style={{ display: "flex", gap: 10 }}><button style={{ ...s.btn2, flex: 1 }} onClick={() => { setTks([]); setQ(""); }}>Search Again</button><button style={{ ...s.btn1, flex: 1 }} onClick={() => window.print()}>Print</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Admin({ go, data, confirm, auth, setAuth, notify }) {
  const [pin, setPin] = useState("");
  const [fl, setFl] = useState("all");
  const PIN = "9211";
  if (!auth) return (
    <div style={s.pg}><Nav go={go} title="Admin" /><div style={s.card}>
      <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🔒</div>
      <h2 style={s.cH}>Admin Access</h2><p style={s.cS}>Enter PIN to continue</p>
      <Fld label=""><input style={{ ...s.inp, textAlign: "center", letterSpacing: 10, fontSize: 22, fontWeight: 700 }} placeholder="• • • •" type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { pin === PIN ? setAuth(true) : notify("Incorrect PIN", "error"); }}} /></Fld>
      <button style={{ ...s.btn1, width: "100%" }} onClick={() => { pin === PIN ? setAuth(true) : notify("Incorrect PIN", "error"); }}>Enter</button>
      <p style={{ fontSize: 11, color: C.txD, textAlign: "center", marginTop: 10 }}>Default PIN: 2026</p>
    </div></div>
  );

  const tks = data.tickets, conf = tks.filter(t => t.status === "confirmed"), pend = tks.filter(t => t.status === "pending"), scnd = tks.filter(t => t.scannedAt);
  const rev = conf.reduce((a, t) => a + t.totalAmount, 0), qty = tks.reduce((a, t) => a + t.quantity, 0);
  const list = fl === "all" ? tks : fl === "confirmed" ? conf : fl === "pending" ? pend : scnd;

  return (
    <div style={s.pg}><Nav go={go} title="Dashboard" />
      <div style={s.statsR}><Stat value={qty} label="Tickets" /><Stat value={conf.length} label="Confirmed" color={C.grn} /><Stat value={pend.length} label="Pending" color={C.yel} /><Stat value={rev.toLocaleString()} label="Birr" color={C.gold} /></div>
      <div style={s.flR}>{["all", "confirmed", "pending", "scanned"].map(f => <button key={f} style={{ ...s.flB, ...(fl === f ? s.flA : {}) }} onClick={() => setFl(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.txD }}>No tickets yet</div> : list.slice().reverse().map(t => (
          <div key={t.id} style={s.aCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div><div style={{ fontWeight: 700, fontSize: 15, color: C.tx }}>{t.name}</div><div style={{ fontSize: 12, fontFamily: "monospace", color: C.gold, marginTop: 2 }}>{genCode(t.id)}</div></div>
              <span style={{ ...s.badge, ...(t.status === "confirmed" ? s.bGrn : s.bYel) }}>{t.status}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: C.txM, marginBottom: 8 }}>
              <span>📱 {t.phone}</span>
              <span>🎟 {t.groupTotal > 1 ? `${t.ticketIndex}/${t.groupTotal}` : "×1"}</span>
              <span>💰 {t.groupTotal > 1 ? `${t.groupTotal * 700} Birr total` : `${t.totalAmount} Birr`}</span>
              {t.paymentMethod && <span>💳 {t.paymentMethod === "cbe" ? "CBE" : "Telebirr"}</span>}
              {t.scannedAt && <span>✅ Scanned</span>}
            </div>
            {t.paymentScreenshot && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: C.txD, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Payment Proof</div><img src={t.paymentScreenshot} alt="proof" style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, border: `1px solid ${C.bd}`, background: C.bg }} /></div>}
            {t.status === "pending" && <button style={s.confB} onClick={() => { confirm(t.id, t.groupId); notify(`Confirmed: ${t.name}${t.groupTotal > 1 ? ` (${t.groupTotal} tickets)` : ""}`); }}>Confirm Payment ✓{t.groupTotal > 1 ? ` (${t.groupTotal} tickets)` : ""}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Scan({ go, validate, notify }) {
  const [inp, setInp] = useState("");
  const [res, setRes] = useState(null);
  const scan = () => { if (!inp.trim()) return; const r = validate(inp.trim()); setRes(r); if (r.ok) notify("Entry approved!"); };
  return (
    <div style={s.pg}><Nav go={go} title="Gate Scanner" /><div style={s.card}>
      <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>📷</div>
      <h2 style={s.cH}>Validate Ticket</h2><p style={s.cS}>Enter ticket code to verify entry</p>
      <Fld label=""><input style={{ ...s.inp, textAlign: "center", fontSize: 17, fontWeight: 600, letterSpacing: 2, fontFamily: "monospace" }} placeholder="LBW-XXXXXX-XXXX" value={inp} onChange={e => setInp(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && scan()} /></Fld>
      <button style={{ ...s.btn1, width: "100%" }} onClick={scan} className="bh">Validate</button>
      {res && <div style={{ ...s.scanB, borderColor: res.ok ? C.grn : C.red, background: res.ok ? C.grnD : C.redD }}>
        <div style={{ fontSize: 40, color: res.ok ? C.grn : C.red }}>{res.ok ? "✓" : "✗"}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.tx }}>{res.msg}</div>
        {res.tk && <div style={{ fontSize: 13, color: C.txM, marginTop: 4 }}>{res.tk.name} — ×{res.tk.quantity}</div>}
      </div>}
      <button style={{ ...s.btn2, width: "100%", marginTop: 12 }} onClick={() => { setInp(""); setRes(null); }}>Clear & Scan Next</button>
    </div></div>
  );
}

const CSS = `* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${C.bg}; } .bh { transition: all 0.2s ease; } .bh:hover { transform: translateY(-1px); filter: brightness(1.1); } .bh:active { transform: translateY(0); filter: brightness(0.95); } input:focus { outline: none; border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.12); } button { cursor: pointer; border: none; outline: none; } @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @media print { body * { visibility: hidden; } #printable-ticket, #printable-ticket * { visibility: visible; } #printable-ticket { position: absolute; top: 0; left: 0; } } ::placeholder { color: ${C.txD}; }`;

const s = {
  app: { minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.tx, background: C.bg, maxWidth: 480, margin: "0 auto", position: "relative" },
  notif: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 13, zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: "90%", textAlign: "center", animation: "fadeIn 0.3s ease" },
  home: { minHeight: "100vh", background: `linear-gradient(170deg, ${C.bg} 0%, #160E28 40%, #1A1030 70%, ${C.bg} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" },
  homeGrain: { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(107,63,160,0.06) 0%, transparent 70%)", pointerEvents: "none" },
  hL1: { position: "absolute", top: "15%", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.bd}, transparent)`, opacity: 0.3, pointerEvents: "none" },
  hL2: { position: "absolute", top: "85%", left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.bd}, transparent)`, opacity: 0.3, pointerEvents: "none" },
  hL3: { position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: `linear-gradient(180deg, transparent 10%, ${C.bd} 50%, transparent 90%)`, opacity: 0.12, pointerEvents: "none" },
  hContent: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, animation: "fadeIn 0.8s ease" },
  hBadge: { fontSize: 9, fontWeight: 700, letterSpacing: 4, color: C.gold, textTransform: "uppercase", padding: "6px 16px", border: `1px solid ${C.gold}35`, borderRadius: 3 },
  hTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 700, color: C.wh, letterSpacing: 14, lineHeight: 1 },
  hDiv: { display: "flex", alignItems: "center", gap: 12, width: 200 },
  hDivLine: { flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` },
  hDivDia: { color: C.gold, fontSize: 8 },
  hYear: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txM, letterSpacing: 10 },
  hDesc: { color: C.txD, fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.7 },
  hPrice: { display: "flex", alignItems: "baseline", gap: 8, padding: "14px 28px", background: C.goldD, borderRadius: 6, border: `1px solid ${C.gold}25` },
  hPrL: { fontSize: 9, fontWeight: 700, letterSpacing: 3, color: C.txM },
  hPrA: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.gold },
  hPrC: { fontSize: 11, fontWeight: 600, color: C.gold, letterSpacing: 2 },
  hBtns: { display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 },
  hLinks: { display: "flex", gap: 16, marginTop: 8, alignItems: "center" },
  fLink: { fontSize: 12, color: C.txD, background: "none", border: "none", fontFamily: "'Inter', sans-serif", fontWeight: 500 },
  btn1: { background: `linear-gradient(135deg, ${C.purD}, ${C.pur})`, color: C.wh, padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 20px rgba(107,63,160,0.25)`, letterSpacing: 0.3 },
  btn2: { background: "transparent", color: C.txM, padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: `1px solid ${C.bd}` },
  pg: { minHeight: "100vh", padding: "0 16px 32px", background: C.bg },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", marginBottom: 8 },
  navBack: { background: "none", color: C.gold, fontWeight: 600, fontSize: 14, fontFamily: "'Inter', sans-serif", padding: "8px 0" },
  navT: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 18, color: C.tx },
  card: { background: C.card, borderRadius: 14, padding: 22, border: `1px solid ${C.bd}`, animation: "fadeIn 0.5s ease" },
  cH: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, textAlign: "center", color: C.wh, marginBottom: 6 },
  cS: { color: C.txD, fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 1.5 },
  okCircle: { width: 50, height: 50, borderRadius: "50%", background: C.grnD, border: `2px solid ${C.grn}`, color: C.grn, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" },
  fmH: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  fmT: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.wh },
  fmS: { color: C.gold, fontSize: 13, fontWeight: 500, marginTop: 2 },
  fmBadge: { fontSize: 13, fontWeight: 800, color: C.gold, fontFamily: "'Cormorant Garamond', serif", padding: "4px 10px", border: `1px solid ${C.gold}35`, borderRadius: 3 },
  divT: { height: 1, background: C.bd, marginBottom: 20 },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: C.txM, marginBottom: 6, letterSpacing: 0.8, textTransform: "uppercase" },
  inp: { width: "100%", padding: "12px 14px", borderRadius: 6, border: `1.5px solid ${C.bd}`, fontSize: 14, fontFamily: "'Inter', sans-serif", color: C.tx, background: C.sf, transition: "border-color 0.2s" },
  qR: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20 },
  qB: { width: 42, height: 42, borderRadius: 6, background: C.sf, color: C.gold, fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.bd}`, fontFamily: "'Inter', sans-serif" },
  qN: { fontSize: 26, fontWeight: 800, color: C.wh, minWidth: 36, textAlign: "center", fontFamily: "'Cormorant Garamond', serif" },
  totBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: `1px solid ${C.bd}`, borderBottom: `1px solid ${C.bd}`, marginBottom: 20 },
  totL: { fontSize: 12, fontWeight: 600, color: C.txM, textTransform: "uppercase", letterSpacing: 1 },
  totA: { fontSize: 24, fontWeight: 700, color: C.gold, fontFamily: "'Cormorant Garamond', serif" },
  secH: { display: "flex", alignItems: "center", gap: 12, margin: "8px 0 14px" },
  secL: { flex: 1, height: 1, background: C.bd },
  secT: { fontSize: 10, fontWeight: 700, color: C.txD, textTransform: "uppercase", letterSpacing: 2.5 },
  payH: { fontSize: 13, color: C.txM, lineHeight: 1.6, marginBottom: 14 },
  payO: { display: "flex", justifyContent: "space-between", alignItems: "center", background: C.sf, borderRadius: 8, padding: "13px 14px", marginBottom: 8, border: `1.5px solid ${C.bd}`, cursor: "pointer", transition: "border-color 0.2s" },
  payOA: { borderColor: C.gold, background: C.goldD },
  payOL: { display: "flex", alignItems: "center", gap: 12 },
  radio: { width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.bdL}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioA: { borderColor: C.gold },
  radioD: { width: 10, height: 10, borderRadius: "50%", background: C.gold },
  payN: { fontSize: 13, fontWeight: 700, color: C.tx, marginBottom: 1 },
  payAc: { fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: "monospace" },
  payHo: { fontSize: 11, color: C.txD },
  payI: { fontSize: 24, opacity: 0.4 },
  upBox: { border: `2px dashed ${C.bdL}`, borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: C.sf, marginBottom: 16 },
  upTx: { fontSize: 13, fontWeight: 600, color: C.txM },
  upHint: { fontSize: 11, color: C.txD, marginTop: 2 },
  upDone: { display: "flex", alignItems: "center", gap: 12, background: C.sf, borderRadius: 8, padding: 12, border: `1.5px solid ${C.gold}35`, marginBottom: 16 },
  upImg: { width: 54, height: 54, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.bd}` },
  upName: { fontSize: 12, fontWeight: 600, color: C.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160, marginBottom: 4 },
  upRm: { fontSize: 12, fontWeight: 600, color: C.red, background: "none", border: "none", padding: 0, fontFamily: "'Inter', sans-serif" },
  iBox: { background: C.sf, borderRadius: 10, padding: 18, marginBottom: 20, border: `1px solid ${C.bd}` },
  iBoxH: { marginBottom: 12 },
  iBoxT: { fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: C.wh, letterSpacing: 1 },
  iBoxC: { fontSize: 12, fontFamily: "monospace", color: C.gold, marginTop: 2 },
  iBoxD: { height: 1, background: C.bd, marginBottom: 4 },
  tkLbl: { fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.wh, letterSpacing: 3 },
  tkSub: { fontSize: 11, color: C.txD, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" },
  tkDiv: { display: "flex", gap: 4, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" },
  tkDot: { width: 3, height: 3, borderRadius: "50%", background: C.bd, display: "inline-block" },
  tkCode: { fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: C.gold, letterSpacing: 2, marginBottom: 8 },
  badge: { padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  bGrn: { background: C.grnD, color: C.grn },
  bYel: { background: C.yelD, color: C.yel },
  statsR: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 },
  stat: { background: C.card, borderRadius: 8, padding: "14px 6px", textAlign: "center", border: `1px solid ${C.bd}` },
  flR: { display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" },
  flB: { padding: "7px 14px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: C.sf, color: C.txM, border: `1px solid ${C.bd}`, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" },
  flA: { background: C.pur, color: C.wh, borderColor: C.pur },
  aCard: { background: C.card, borderRadius: 10, padding: 16, border: `1px solid ${C.bd}` },
  confB: { marginTop: 8, width: "100%", padding: "10px 0", borderRadius: 6, background: C.grn, color: C.bg, fontWeight: 700, fontSize: 13, fontFamily: "'Inter', sans-serif" },
  scanB: { marginTop: 18, padding: 18, borderRadius: 10, border: "2px solid", textAlign: "center", animation: "fadeIn 0.3s ease" },
};

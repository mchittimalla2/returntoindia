import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Plus, Trash2, Download, Upload, Target, CalendarDays, TrendingUp, WalletCards } from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "returnToIndiaPlanV1";

const seed = {
  startDate: "2026-09-01",
  originalMonths: 36,
  usdInr: 88,
  annualReturnPct: 8,
  expectedMonthlySavingsInr: 364000,
  goals: [
    { id: crypto.randomUUID(), name: "Home Loan", target: 7000000 },
    { id: crypto.randomUUID(), name: "Agricultural Land", target: 7000000 },
    { id: crypto.randomUUID(), name: "Cash Corpus", target: 4000000 },
    { id: crypto.randomUUID(), name: "Car", target: 0 },
    { id: crypto.randomUUID(), name: "Interiors", target: 0 },
    { id: crypto.randomUUID(), name: "Gold", target: 0 }
  ],
  entries: []
};

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seed;
  } catch {
    return seed;
  }
}

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthDiff(fromStr, toDate) {
  const from = new Date(fromStr + "T00:00:00");
  return Math.max(0, (toDate.getFullYear() - from.getFullYear()) * 12 + toDate.getMonth() - from.getMonth());
}

function App() {
  const [plan, setPlan] = useState(loadPlan);
  const [draft, setDraft] = useState({
    month: new Date().toISOString().slice(0, 7),
    goalId: "",
    type: "cash",
    currency: "INR",
    amount: "",
    note: ""
  });

  const persist = (next) => {
    setPlan(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const totalTarget = useMemo(
    () => plan.goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0),
    [plan.goals]
  );

  const achievedByGoal = useMemo(() => {
    const map = {};
    for (const entry of plan.entries) {
      const inr = entry.currency === "USD"
        ? Number(entry.amount || 0) * Number(plan.usdInr || 0)
        : Number(entry.amount || 0);
      map[entry.goalId] = (map[entry.goalId] || 0) + inr;
    }
    return map;
  }, [plan.entries, plan.usdInr]);

  const totalAchieved = Object.values(achievedByGoal).reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, totalTarget - totalAchieved);

  const avgActualMonthly = useMemo(() => {
    if (!plan.entries.length) return 0;
    const months = {};
    for (const entry of plan.entries) {
      const inr = entry.currency === "USD"
        ? Number(entry.amount || 0) * Number(plan.usdInr || 0)
        : Number(entry.amount || 0);
      months[entry.month] = (months[entry.month] || 0) + inr;
    }
    const values = Object.values(months);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }, [plan.entries, plan.usdInr]);

  const projectedMonthly = avgActualMonthly > 0
    ? avgActualMonthly
    : Number(plan.expectedMonthlySavingsInr || 0);

  const monthlyRate = Number(plan.annualReturnPct || 0) / 100 / 12;

  const monthsRemaining = useMemo(() => {
    if (remaining <= 0) return 0;
    if (projectedMonthly <= 0) return Infinity;
    let corpus = totalAchieved;
    for (let month = 1; month <= 600; month++) {
      corpus = corpus * (1 + monthlyRate) + projectedMonthly;
      if (corpus >= totalTarget) return month;
    }
    return Infinity;
  }, [remaining, projectedMonthly, totalAchieved, totalTarget, monthlyRate]);

  const originalTargetDate = addMonths(plan.startDate, Number(plan.originalMonths || 0));
  const elapsedMonths = monthDiff(plan.startDate, new Date());
  const projectedTotalMonths = Number.isFinite(monthsRemaining)
    ? elapsedMonths + monthsRemaining
    : Infinity;
  const projectedDate = Number.isFinite(projectedTotalMonths)
    ? addMonths(plan.startDate, projectedTotalMonths)
    : null;
  const delta = Number.isFinite(projectedTotalMonths)
    ? projectedTotalMonths - Number(plan.originalMonths || 0)
    : null;

  const updateGoal = (id, patch) => {
    persist({
      ...plan,
      goals: plan.goals.map((goal) => goal.id === id ? { ...goal, ...patch } : goal)
    });
  };

  const addGoal = () => {
    persist({
      ...plan,
      goals: [...plan.goals, { id: crypto.randomUUID(), name: "New Goal", target: 0 }]
    });
  };

  const removeGoal = (id) => {
    persist({
      ...plan,
      goals: plan.goals.filter((goal) => goal.id !== id),
      entries: plan.entries.filter((entry) => entry.goalId !== id)
    });
  };

  const addEntry = (event) => {
    event.preventDefault();
    if (!draft.goalId || !draft.amount || Number(draft.amount) <= 0) return;
    persist({
      ...plan,
      entries: [
        ...plan.entries,
        { ...draft, id: crypto.randomUUID(), amount: Number(draft.amount) }
      ]
    });
    setDraft({ ...draft, amount: "", note: "" });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "return-to-india-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    if (!file) return;
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    persist(parsed);
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>Return to India Financial Tracker</h1>
          <p>Track real progress and let the target date move with your actual savings.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={exportData}><Download size={16}/> Backup</button>
          <label className="secondary file-btn">
            <Upload size={16}/> Restore
            <input type="file" accept="application/json" onChange={(event) => importData(event.target.files?.[0])}/>
          </label>
        </div>
      </header>

      <section className="hero-grid">
        <div className="card metric"><Target/><span>Total target</span><strong>{formatINR(totalTarget)}</strong></div>
        <div className="card metric"><WalletCards/><span>Achieved</span><strong>{formatINR(totalAchieved)}</strong></div>
        <div className="card metric"><TrendingUp/><span>Remaining</span><strong>{formatINR(remaining)}</strong></div>
        <div className="card metric"><CalendarDays/><span>Projected completion</span><strong>{projectedDate ? projectedDate.toLocaleDateString("en-US",{month:"short",year:"numeric"}) : "No projection"}</strong></div>
      </section>

      <section className="card status-card">
        <div><span>Original target</span><strong>{originalTargetDate.toLocaleDateString("en-US",{month:"short",year:"numeric"})}</strong></div>
        <div><span>Current projection</span><strong>{projectedDate ? projectedDate.toLocaleDateString("en-US",{month:"short",year:"numeric"}) : "—"}</strong></div>
        <div><span>Status</span><strong className={delta !== null && delta <= 0 ? "good" : "warn"}>
          {delta === null ? "No projection" : delta === 0 ? "On plan" : delta < 0 ? Math.abs(delta) + " months ahead" : delta + " months behind"}
        </strong></div>
        <div><span>Average monthly progress</span><strong>{formatINR(projectedMonthly)}</strong></div>
      </section>

      <section className="two-col">
        <div className="card">
          <div className="section-title"><h2>Plan Settings</h2></div>
          <div className="form-grid">
            <label>Plan start date<input type="date" value={plan.startDate} onChange={(e)=>persist({...plan,startDate:e.target.value})}/></label>
            <label>Original plan months<input type="number" value={plan.originalMonths} onChange={(e)=>persist({...plan,originalMonths:Number(e.target.value)})}/></label>
            <label>USD → INR<input type="number" value={plan.usdInr} onChange={(e)=>persist({...plan,usdInr:Number(e.target.value)})}/></label>
            <label>Annual return %<input type="number" step="0.1" value={plan.annualReturnPct} onChange={(e)=>persist({...plan,annualReturnPct:Number(e.target.value)})}/></label>
            <label className="span2">Expected monthly savings (INR)<input type="number" value={plan.expectedMonthlySavingsInr} onChange={(e)=>persist({...plan,expectedMonthlySavingsInr:Number(e.target.value)})}/></label>
          </div>
          <p className="hint">Once you start entering real monthly updates, the projection uses your actual monthly average.</p>
        </div>

        <div className="card">
          <div className="section-title"><h2>Add Monthly Update</h2></div>
          <form className="form-grid" onSubmit={addEntry}>
            <label>Month<input type="month" value={draft.month} onChange={(e)=>setDraft({...draft,month:e.target.value})}/></label>
            <label>Goal<select value={draft.goalId} onChange={(e)=>setDraft({...draft,goalId:e.target.value})}><option value="">Select goal</option>{plan.goals.map((goal)=><option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></label>
            <label>Type<select value={draft.type} onChange={(e)=>setDraft({...draft,type:e.target.value})}><option value="cash">Cash saving</option><option value="loan">Loan principal paid</option><option value="investment">Investment contribution/value</option><option value="other">Other</option></select></label>
            <label>Currency<select value={draft.currency} onChange={(e)=>setDraft({...draft,currency:e.target.value})}><option>INR</option><option>USD</option></select></label>
            <label>Amount<input type="number" value={draft.amount} onChange={(e)=>setDraft({...draft,amount:e.target.value})}/></label>
            <label>Note<input value={draft.note} onChange={(e)=>setDraft({...draft,note:e.target.value})} placeholder="Robinhood, EMI principal, etc."/></label>
            <button className="primary span2" type="submit">Save update</button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="section-title"><h2>Goals</h2><button className="primary small" onClick={addGoal}><Plus size={16}/> Add goal</button></div>
        <div className="goal-list">
          {plan.goals.map((goal) => {
            const achieved = achievedByGoal[goal.id] || 0;
            const pct = goal.target > 0 ? Math.min(100, achieved / goal.target * 100) : 0;
            return (
              <div className="goal-row" key={goal.id}>
                <div className="goal-inputs">
                  <input value={goal.name} onChange={(e)=>updateGoal(goal.id,{name:e.target.value})}/>
                  <input type="number" value={goal.target} onChange={(e)=>updateGoal(goal.id,{target:Number(e.target.value)})}/>
                  <button className="icon-btn" onClick={()=>removeGoal(goal.id)}><Trash2 size={16}/></button>
                </div>
                <div className="goal-meta"><span>{formatINR(achieved)} of {formatINR(goal.target)}</span><span>{pct.toFixed(1)}%</span></div>
                <div className="bar"><div style={{width:pct + "%"}}/></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title"><h2>Monthly History</h2></div>
        {plan.entries.length === 0 ? (
          <p className="empty">No updates yet. Add your first saving, loan payment, or investment.</p>
        ) : (
          <div className="table-wrap"><table><thead><tr><th>Month</th><th>Goal</th><th>Type</th><th>Amount</th><th>INR value</th><th>Note</th><th></th></tr></thead><tbody>
            {[...plan.entries].reverse().map((entry)=>{
              const goal = plan.goals.find((g)=>g.id===entry.goalId);
              const inr = entry.currency === "USD" ? entry.amount * plan.usdInr : entry.amount;
              return <tr key={entry.id}>
                <td>{entry.month}</td>
                <td>{goal?.name || "Deleted goal"}</td>
                <td>{entry.type}</td>
                <td>{entry.currency === "USD" ? "$" : "₹"}{Number(entry.amount).toLocaleString()}</td>
                <td>{formatINR(inr)}</td>
                <td>{entry.note}</td>
                <td><button className="icon-btn" onClick={()=>persist({...plan,entries:plan.entries.filter((x)=>x.id!==entry.id)})}><Trash2 size={15}/></button></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </section>

      <footer>All data stays in this browser on your laptop. Use Backup periodically.</footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
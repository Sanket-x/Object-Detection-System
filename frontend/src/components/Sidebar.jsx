import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STATS_URL = 'http://localhost:8000/stats';

/* ── Reusable stat card ─────────────────────────────── */
function StatCard({ icon, label, value, accent = 'indigo', delay = 0 }) {
  const accentMap = {
    indigo:  'from-indigo-500/20 to-indigo-600/5  text-indigo-400  border-indigo-500/10',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/10',
    purple:  'from-purple-500/20 to-purple-600/5  text-purple-400  border-purple-500/10',
    cyan:    'from-cyan-500/20 to-cyan-600/5      text-cyan-400    border-cyan-500/10',
    rose:    'from-rose-500/20 to-rose-600/5      text-rose-400    border-rose-500/10',
  };

  const classes = accentMap[accent] || accentMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl bg-gradient-to-br ${classes} border glass p-4 flex flex-col gap-1`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </motion.div>
  );
}

/* ── Activity log entry ─────────────────────────────── */
function LogEntry({ time, message, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
    >
      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs text-slate-300">{message}</span>
        <span className="text-[10px] text-slate-600">{time}</span>
      </div>
    </motion.div>
  );
}

/* ── Main Sidebar ───────────────────────────────────── */
export default function Sidebar() {
  const [stats, setStats] = useState({
    objects: 0,
    confidence: 0.0,
    fps: 0.0,
    alerts: 0,
    status: 'Inactive',
    classes: [],
  });

  // Fetch live stats every 1 second
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(STATS_URL);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        // Silently handle — API might not be running yet
      }
    };

    fetchStats(); // initial fetch
    const interval = setInterval(fetchStats, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-5 min-w-[280px]"
    >
      {/* ── Section Title ──────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
          Detection Info
        </h2>
      </div>

      {/* ── Stat Cards (all dynamic) ───────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon="📦"
          label="Objects"
          value={stats.objects}
          accent="indigo"
          delay={0.35}
        />
        <StatCard
          icon="🎯"
          label="Accuracy"
          value={stats.confidence.toFixed(2)}
          accent="cyan"
          delay={0.4}
        />
        <StatCard
          icon="⚡"
          label="FPS"
          value={stats.fps}
          accent="purple"
          delay={0.45}
        />
        <StatCard
          icon="🛡️"
          label="Alerts"
          value={stats.alerts}
          accent="rose"
          delay={0.5}
        />
      </div>

      {/* ── Status Card (dynamic) ──────────────────── */}
      <div className="glass rounded-xl border border-white/5 p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center border ${
          stats.status === 'Active'
            ? 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/10'
            : 'from-slate-500/20  to-slate-600/5  border-slate-500/10'
        }`}>
          <span className={`h-3 w-3 rounded-full ${
            stats.status === 'Active' ? 'bg-emerald-400 animate-pulse-dot' : 'bg-slate-500'
          }`} />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${
            stats.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            {stats.status}
          </span>
          <span className="text-[11px] text-slate-500">
            {stats.status === 'Active' ? 'Monitoring in progress' : 'Waiting for feed'}
          </span>
        </div>
      </div>

      {/* ── Detected Classes ───────────────────────── */}
      {stats.classes.length > 0 && (
        <div className="glass rounded-xl border border-white/5 p-4 flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detected Classes
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {stats.classes.map((cls) => (
              <span
                key={cls}
                className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity Log ───────────────────────────── */}
      <div className="glass rounded-xl border border-white/5 p-4 flex flex-col gap-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Recent Activity
        </h3>
        <LogEntry time="Just now"  message="System initialized"          delay={0.55} />
        <LogEntry time="—"         message="Webcam connected"            delay={0.6}  />
        <LogEntry time="—"         message="YOLOv8n model loaded"        delay={0.65} />
        <LogEntry time="—"         message={`Tracking ${stats.objects} object(s)`} delay={0.7} />
      </div>

      {/* ── Footer text ────────────────────────────── */}
      <p className="text-[10px] text-slate-600 text-center mt-auto">
        Powered by YOLOv8 · FastAPI · React
      </p>
    </motion.aside>
  );
}

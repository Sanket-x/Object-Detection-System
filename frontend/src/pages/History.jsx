import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/history?limit=50');
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex-1 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1000px] mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl shadow-black/50"
      >
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white">Detection History</h2>
          <p className="text-sm text-slate-400 mt-1">Latest 50 recorded instances across the system.</p>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading history logs...</div>
          ) : logs.length === 0 ? (
             <div className="p-12 text-center text-slate-400">No detections recorded yet.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/5 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-300">ID</th>
                    <th className="px-6 py-4 font-medium text-slate-300">Detected Object</th>
                    <th className="px-6 py-4 font-medium text-slate-300">Confidence</th>
                    <th className="px-6 py-4 font-medium text-slate-300">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono">#{log.id}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium capitalize border border-indigo-500/20">
                          {log.object}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`${log.confidence > 0.8 ? 'text-emerald-400' : 'text-amber-400'} font-medium`}>
                            {Math.round(log.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

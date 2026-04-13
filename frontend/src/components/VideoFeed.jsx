import { useState } from 'react';
import { motion } from 'framer-motion';

const FEED_URL = 'http://localhost:8000/video_feed';

export default function VideoFeed() {
  const [isActive, setIsActive] = useState(true);

  const handleToggle = async () => {
    try {
      const newState = !isActive;
      const res = await fetch('http://localhost:8000/toggle_camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
      if (res.ok) {
        setIsActive(newState);
      }
    } catch (err) {
      console.error("Toggle API failed", err);
    }
  };

  const handleSnapshot = async () => {
    try {
      const res = await fetch('http://localhost:8000/snapshot');
      if (!res.ok) throw new Error("Snapshot failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapshot_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
      className="flex flex-col gap-3"
    >
      {/* Header Info & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse-dot" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {isActive ? 'Live Feed' : 'Camera Stopped'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggle}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              isActive 
                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {isActive ? 'Stop Camera' : 'Start Camera'}
          </button>
          
          <button 
            onClick={handleSnapshot}
            disabled={!isActive}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Capture
          </button>
        </div>
      </div>

      {/* Video Card */}
      <div className="relative rounded-2xl overflow-hidden gradient-border shadow-glow-lg h-full max-h-[70vh]">
        <div className="glass rounded-2xl p-1 h-full">
          {isActive ? (
            <img
              // Trick frontend into busting cache when reactivating feed if necessary, though mjpeg stream handles itself.
              src={`${FEED_URL}?t=${isActive ? 1 : 0}`} 
              alt="Live YOLOv8 Detection Feed"
              className="w-full h-full rounded-xl object-contain bg-surface-900 border border-white/5"
            />
          ) : (
            <div className="w-full h-full rounded-xl aspect-video bg-surface-900 flex items-center justify-center border border-white/5">
              <span className="text-slate-500 text-sm font-medium">Camera paused. Feed disconnected.</span>
            </div>
          )}
        </div>

        {/* Corner badge */}
        {isActive && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs font-medium text-red-400 border border-red-500/20">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            REC
          </div>
        )}

        {/* Model badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg glass text-[10px] font-medium text-slate-400 border border-white/5">
          YOLOv8s · GPU Accelerated
        </div>
      </div>
    </motion.div>
  );
}

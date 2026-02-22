import { Menu, Activity, Wifi, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export const Header = ({ onMenuClick, currentSession }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header" data-testid="app-header">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-[#666666] hover:text-[#00FF41] transition-colors"
          data-testid="mobile-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Session Info */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-2 h-2 bg-[#00FF41] rounded-full status-pulse" />
          <span className="font-mono text-xs text-[#666666] tracking-wider">
            {currentSession ? `SESSION: ${currentSession.name.toUpperCase()}` : "NO ACTIVE SESSION"}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-6">
        {/* System Status */}
        <div className="hidden md:flex items-center gap-4 text-[#666666]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00FF41]" />
            <span className="font-mono text-[10px] tracking-wider">SYSTEM OK</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#00FF41]" />
            <span className="font-mono text-[10px] tracking-wider">CONNECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00FF41]" />
            <span className="font-mono text-[10px] tracking-wider">SECURE</span>
          </div>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-2 text-[#00FF41]">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-xs tracking-wider glow-text">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
};

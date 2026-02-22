import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Plus, 
  Trash2, 
  MessageSquare,
  Shield,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Sidebar = ({ 
  sessions, 
  currentSession, 
  onSelectSession, 
  onCreateSession,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  const [hoveredSession, setHoveredSession] = useState(null);

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      data-testid="sidebar"
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-[rgba(0,255,65,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[#00FF41]/10 border border-[#00FF41]/30">
              <Shield className="w-5 h-5 text-[#00FF41]" />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-wider text-[#00FF41] glow-text">
                NEXUS
              </h1>
              <p className="text-[10px] text-[#666666] tracking-widest uppercase">
                Pentest LLM
              </p>
            </div>
          </div>
          <button
            className="md:hidden p-2 text-[#666666] hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* New Session Button */}
      <div className="p-3">
        <Button
          onClick={() => onCreateSession("New Session")}
          className="w-full bg-transparent border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/10 hover:border-[#00FF41]/60 font-mono text-xs tracking-wider"
          data-testid="new-session-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          NEW SESSION
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <div className="px-4 py-2">
          <span className="font-mono text-[10px] text-[#666666] tracking-widest uppercase">
            Sessions
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="session-list">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => onSelectSession(session)}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  data-testid={`session-item-${session.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-4 h-4 text-[#666666] flex-shrink-0" />
                      <span className="font-mono text-xs text-white/80 truncate">
                        {session.name}
                      </span>
                    </div>
                    {hoveredSession === session.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 text-[#FF3B30] hover:bg-[#FF3B30]/10"
                        data-testid={`delete-session-${session.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </motion.button>
                    )}
                  </div>
                  {session.message_count > 0 && (
                    <span className="text-[10px] text-[#666666] ml-6">
                      {session.message_count} messages
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(0,255,65,0.2)]">
        <div className="flex items-center gap-2 text-[#666666]">
          <Terminal className="w-4 h-4" />
          <span className="font-mono text-[10px] tracking-wider">
            MCP ENABLED
          </span>
          <span className="w-2 h-2 bg-[#00FF41] rounded-full status-pulse ml-auto" />
        </div>
      </div>
    </aside>
  );
};

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ChatInterface = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content) => {
    // Simple code block detection
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3);
        const [lang, ...lines] = code.split("\n");
        return (
          <pre
            key={index}
            className="bg-black/50 border border-[rgba(0,255,65,0.2)] p-3 my-2 overflow-x-auto font-mono text-xs text-[#00FF41]"
          >
            {lines.join("\n")}
          </pre>
        );
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#00FF41]" />
          <span className="panel-title">NEXUS TERMINAL</span>
        </div>
        <div className="status-badge ready">
          <span className="w-2 h-2 bg-[#00FF41] rounded-full" />
          ONLINE
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-[#00FF41]/10 border border-[#00FF41]/30 mb-4">
                <Bot className="w-8 h-8 text-[#00FF41]" />
              </div>
              <h3 className="font-mono text-sm text-[#00FF41] mb-2 tracking-wider">
                NEXUS READY
              </h3>
              <p className="text-xs text-[#666666] max-w-md leading-relaxed">
                I'm your AI-powered penetration testing assistant. Ask me to scan networks, 
                analyze vulnerabilities, crack passwords, or execute any Kali Linux tool.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {["Scan network with nmap", "Run nikto web scan", "Execute SQL injection test"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-[10px] font-mono text-[#00FF41] border border-[#00FF41]/30 hover:bg-[#00FF41]/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`message ${message.role}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-[#00FF41]/20 text-[#00FF41]" 
                        : "bg-[#00F0FF]/20 text-[#00F0FF]"
                    }`}>
                      {message.role === "user" ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-[#666666] mb-1 tracking-wider">
                        {message.role === "user" ? "OPERATOR" : "NEXUS"}
                      </div>
                      <div className="text-sm leading-relaxed">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="message assistant"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center bg-[#00F0FF]/20 text-[#00F0FF]">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command or query..."
            className="chat-input flex-1"
            rows={1}
            disabled={isLoading}
            data-testid="chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/20 hover:border-[#00FF41]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            data-testid="chat-send-btn"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

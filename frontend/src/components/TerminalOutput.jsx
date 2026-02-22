import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Trash2, Copy, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export const TerminalOutput = ({ output, onClear }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Output copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_output_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Output downloaded");
  };

  const formatOutput = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, index) => {
      let className = "text-[#00FF41]";
      
      if (line.startsWith("[+]") || line.includes("success")) {
        className = "text-[#00FF41]";
      } else if (line.startsWith("[-]") || line.includes("error") || line.includes("Error")) {
        className = "text-[#FF3B30]";
      } else if (line.startsWith("[*]") || line.includes("INFO")) {
        className = "text-[#00F0FF]";
      } else if (line.startsWith("[!]") || line.includes("warning") || line.includes("Warning")) {
        className = "text-[#FFB000]";
      } else if (line.includes("PORT") || line.includes("STATE") || line.includes("SERVICE")) {
        className = "text-white/90 font-semibold";
      }

      return (
        <div key={index} className={className}>
          {line || "\u00A0"}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="terminal-output-container">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00FF41]" />
          <span className="panel-title">OUTPUT TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!output}
            className="p-1.5 text-[#666666] hover:text-[#00FF41] disabled:opacity-30 transition-colors"
            title="Copy output"
            data-testid="copy-output-btn"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!output}
            className="p-1.5 text-[#666666] hover:text-[#00FF41] disabled:opacity-30 transition-colors"
            title="Download output"
            data-testid="download-output-btn"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            disabled={!output}
            className="p-1.5 text-[#666666] hover:text-[#FF3B30] disabled:opacity-30 transition-colors"
            title="Clear output"
            data-testid="clear-output-btn"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea className="flex-1 bg-black" ref={scrollRef}>
        <div className="terminal-output min-h-[300px] relative scanlines">
          {!output ? (
            <div className="text-[#666666]">
              <div className="mb-2">
                <span className="text-[#00FF41]">root@nexus</span>
                <span className="text-white">:</span>
                <span className="text-[#00F0FF]">~</span>
                <span className="text-white">$ </span>
                <span className="cursor-blink">_</span>
              </div>
              <div className="text-xs opacity-50">
                Execute tools from the Tools Panel to see output here...
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-xs leading-relaxed"
            >
              {formatOutput(output)}
              <div className="mt-2">
                <span className="text-[#00FF41]">root@nexus</span>
                <span className="text-white">:</span>
                <span className="text-[#00F0FF]">~</span>
                <span className="text-white">$ </span>
                <span className="cursor-blink">_</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/5 bg-black">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#666666]">
          <span>{output ? output.split("\n").length : 0} lines</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, 
  Globe, 
  Key, 
  Bug, 
  Wifi, 
  Search,
  Play,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categoryIcons = {
  network: Network,
  web: Globe,
  password: Key,
  exploitation: Bug,
  wireless: Wifi,
  recon: Search,
};

const categoryColors = {
  network: "#00FF41",
  web: "#00F0FF",
  password: "#FFB000",
  exploitation: "#FF3B30",
  wireless: "#9B59B6",
  recon: "#3498DB",
};

export const ToolsPanel = ({ tools, categories, onExecuteTool }) => {
  const [expandedCategory, setExpandedCategory] = useState("network");
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolParams, setToolParams] = useState({ target: "", port: "80" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToolClick = (tool) => {
    setSelectedTool(tool);
    setToolParams({ target: "", port: "80" });
    setDialogOpen(true);
  };

  const handleExecute = () => {
    if (selectedTool) {
      onExecuteTool(selectedTool.id, toolParams);
      setDialogOpen(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="flex flex-col h-full" data-testid="tools-panel-container">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">KALI TOOLS</span>
        <span className="text-[10px] font-mono text-[#666666]">
          {Object.values(tools).flat().length} AVAILABLE
        </span>
      </div>

      {/* Tools List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category] || Network;
            const color = categoryColors[category] || "#00FF41";
            const categoryTools = tools[category] || [];
            const isExpanded = expandedCategory === category;

            return (
              <div key={category} className="border border-white/5">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  data-testid={`category-${category}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-xs text-white/90 uppercase tracking-wider">
                        {category}
                      </span>
                      <span className="block text-[10px] text-[#666666]">
                        {categoryTools.length} tools
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#666666]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#666666]" />
                  )}
                </button>

                {/* Tools Grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="tool-grid border-t border-white/5">
                        {categoryTools.map((tool) => (
                          <motion.div
                            key={tool.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToolClick(tool);
                            }}
                            className="tool-card p-3 bg-black/30 border border-white/5 text-left cursor-pointer"
                            data-testid={`tool-${tool.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span 
                                className="font-mono text-xs font-semibold"
                                style={{ color }}
                              >
                                {tool.name}
                              </span>
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                            <p className="text-[10px] text-[#666666] line-clamp-2">
                              {tool.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Tool Execution Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border border-[rgba(0,255,65,0.3)]">
          <DialogHeader>
            <DialogTitle className="font-mono text-[#00FF41] tracking-wider">
              {selectedTool?.name?.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              {selectedTool?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-white/70">TARGET</Label>
              <Input
                value={toolParams.target}
                onChange={(e) => setToolParams({ ...toolParams, target: e.target.value })}
                placeholder="e.g., 192.168.1.1 or example.com"
                className="bg-black border-[rgba(0,255,65,0.3)] text-white font-mono focus:border-[#00FF41]"
                data-testid="tool-target-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-white/70">PORT (OPTIONAL)</Label>
              <Input
                value={toolParams.port}
                onChange={(e) => setToolParams({ ...toolParams, port: e.target.value })}
                placeholder="e.g., 80, 443, 22"
                className="bg-black border-[rgba(0,255,65,0.3)] text-white font-mono focus:border-[#00FF41]"
                data-testid="tool-port-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/10 text-white/70 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecute}
              className="bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/20"
              data-testid="tool-execute-btn"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

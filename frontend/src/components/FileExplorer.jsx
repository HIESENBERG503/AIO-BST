import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronUp,
  FileText,
  Code,
  Terminal as TerminalIcon,
  RefreshCw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const getFileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
      return FileText;
    case 'py':
    case 'js':
    case 'sh':
      return Code;
    default:
      return File;
  }
};

export const FileExplorer = ({ files, currentPath, onNavigate, onReadFile }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleItemClick = (item) => {
    if (item.type === "directory") {
      const newPath = currentPath === "/" 
        ? `/${item.name}` 
        : `${currentPath}/${item.name}`;
      onNavigate(newPath);
    } else {
      setSelectedFile(item.name);
      const filePath = currentPath === "/" 
        ? `/${item.name}` 
        : `${currentPath}/${item.name}`;
      onReadFile(filePath);
    }
  };

  const handleGoUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? "/" : `/${parts.join("/")}`;
    onNavigate(newPath);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "-";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col h-full" data-testid="file-explorer-container">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#00FF41]" />
          <span className="panel-title">FILE EXPLORER</span>
        </div>
        <button
          onClick={() => onNavigate(currentPath)}
          className="p-1 text-[#666666] hover:text-[#00FF41] transition-colors"
          data-testid="refresh-files-btn"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Path Bar */}
      <div className="px-3 py-2 border-b border-white/5 bg-black/30">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3 h-3 text-[#666666]" />
          <span className="font-mono text-xs text-[#00FF41]">
            /sandbox{currentPath === "/" ? "" : currentPath}
          </span>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Go Up Button */}
          {currentPath !== "/" && (
            <button
              onClick={handleGoUp}
              className="w-full file-tree-item flex items-center gap-3 p-2 text-left hover:bg-[rgba(0,255,65,0.05)]"
              data-testid="go-up-btn"
            >
              <ChevronUp className="w-4 h-4 text-[#666666]" />
              <span className="font-mono text-xs text-[#666666]">..</span>
            </button>
          )}

          {/* Files and Folders */}
          {files.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-8 h-8 text-[#666666]/50 mx-auto mb-2" />
              <p className="text-xs text-[#666666]">Empty directory</p>
            </div>
          ) : (
            files
              .sort((a, b) => {
                // Directories first
                if (a.type === "directory" && b.type !== "directory") return -1;
                if (a.type !== "directory" && b.type === "directory") return 1;
                return a.name.localeCompare(b.name);
              })
              .map((item) => {
                const FileIcon = item.type === "directory" ? Folder : getFileIcon(item.name);
                const isSelected = selectedFile === item.name && item.type !== "directory";

                return (
                  <motion.button
                    key={item.name}
                    whileHover={{ x: 2 }}
                    onClick={() => handleItemClick(item)}
                    className={`w-full file-tree-item flex items-center gap-3 p-2 text-left ${
                      isSelected ? "bg-[rgba(0,255,65,0.1)] border-l-2 border-[#00FF41]" : ""
                    }`}
                    data-testid={`file-item-${item.name}`}
                  >
                    <FileIcon 
                      className={`w-4 h-4 ${
                        item.type === "directory" ? "text-[#FFB000]" : "text-[#00F0FF]"
                      }`} 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-white/80 truncate block">
                        {item.name}
                      </span>
                    </div>
                    {item.type === "directory" ? (
                      <ChevronRight className="w-4 h-4 text-[#666666]" />
                    ) : (
                      <span className="font-mono text-[10px] text-[#666666]">
                        {formatSize(item.size)}
                      </span>
                    )}
                  </motion.button>
                );
              })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/5 bg-black/30">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#666666]">
          <span>{files.length} items</span>
          <span>MCP ACCESS</span>
        </div>
      </div>
    </div>
  );
};

# NEXUS - Pentest LLM with MCP Tool Calling

## Original Problem Statement
Create a fully formed local pentest LLM with Kali MCP tool calling and local MCP file access.

## User Choices
- **LLM Provider**: GPT-5.2 with Emergent LLM Key (free option)
- **Kali Tools**: Full scope - Network, Web, Password, Exploitation, Wireless, Recon
- **File Access**: All operations - read, write, list, delete, execute
- **UI**: Modern GUI with hacker aesthetic

## Architecture

### Backend (FastAPI)
- `/api/chat` - AI-powered pentest assistant using GPT-5.2
- `/api/tools` - Kali tool definitions and categories
- `/api/tools/execute` - Simulated tool execution with realistic outputs
- `/api/sessions` - Chat session management
- `/api/files/*` - MCP file system operations (sandboxed)
- MongoDB for persistence (sessions, messages, tool logs)

### Frontend (React)
- **Sidebar**: Session management
- **Chat Interface**: AI assistant terminal
- **Tools Panel**: Bento grid of 30+ Kali tools
- **Terminal Output**: Real-time tool execution results
- **File Explorer**: MCP file system browser

### Design Theme: "The Operator"
- Dark background (#050505)
- Neon green accent (#00FF41)
- JetBrains Mono font
- Glass-morphism panels
- Terminal aesthetic

## What's Been Implemented (Jan 2026)
- [x] AI chat with GPT-5.2 integration
- [x] 30+ Kali tools across 6 categories
- [x] Simulated tool execution with realistic output
- [x] Session persistence with MongoDB
- [x] MCP file system sandbox
- [x] Modern hacker-aesthetic UI
- [x] Tool execution dialog with parameter input
- [x] Terminal output with syntax highlighting
- [x] File explorer with navigation

## Tool Categories
1. **Network**: nmap, netcat, masscan, hping3, arp-scan, tcpdump
2. **Web**: nikto, dirb, sqlmap, gobuster, wpscan, burpsuite
3. **Password**: hydra, john, hashcat, medusa, cewl
4. **Exploitation**: metasploit, searchsploit, msfvenom, beef
5. **Wireless**: aircrack-ng, reaver, wifite, kismet
6. **Recon**: whois, theHarvester, maltego, recon-ng, shodan

## Prioritized Backlog

### P0 (Critical)
- [x] Core chat functionality
- [x] Tool execution simulation
- [x] Session management

### P1 (High Priority)
- [ ] Real Kali tool execution (requires Docker integration)
- [ ] Export scan results to PDF
- [ ] Tool chaining/automation

### P2 (Nice to Have)
- [ ] Vulnerability database integration
- [ ] Custom wordlist management
- [ ] Report generation templates
- [ ] Multi-target scanning

## Next Tasks
1. Add real tool execution via Docker containers
2. Implement scan result persistence
3. Add vulnerability correlation
4. Create automated scan workflows

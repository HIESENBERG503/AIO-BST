from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import subprocess
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    session_id: str

class ToolExecutionRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    session_id: str

class ToolExecutionResponse(BaseModel):
    tool_name: str
    status: str  # "success", "error", "running"
    output: str
    execution_time: float

class FileOperation(BaseModel):
    operation: str  # "read", "write", "list", "delete", "execute"
    path: str
    content: Optional[str] = None

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_count: int = 0

# ============ KALI TOOLS DEFINITIONS ============

KALI_TOOLS = {
    "network": [
        {"id": "nmap", "name": "Nmap", "description": "Network exploration and security auditing", "category": "network"},
        {"id": "netcat", "name": "Netcat", "description": "TCP/UDP connections and network debugging", "category": "network"},
        {"id": "masscan", "name": "Masscan", "description": "Fast port scanner", "category": "network"},
        {"id": "hping3", "name": "Hping3", "description": "Network packet generator and analyzer", "category": "network"},
        {"id": "arp-scan", "name": "ARP-scan", "description": "ARP scanning and fingerprinting", "category": "network"},
        {"id": "tcpdump", "name": "TCPdump", "description": "Network packet analyzer", "category": "network"},
    ],
    "web": [
        {"id": "nikto", "name": "Nikto", "description": "Web server scanner", "category": "web"},
        {"id": "dirb", "name": "Dirb", "description": "Web content scanner/directory brute forcer", "category": "web"},
        {"id": "sqlmap", "name": "SQLmap", "description": "Automatic SQL injection tool", "category": "web"},
        {"id": "gobuster", "name": "Gobuster", "description": "Directory/file & DNS busting tool", "category": "web"},
        {"id": "wpscan", "name": "WPScan", "description": "WordPress vulnerability scanner", "category": "web"},
        {"id": "burpsuite", "name": "Burp Suite", "description": "Web application security testing", "category": "web"},
    ],
    "password": [
        {"id": "hydra", "name": "Hydra", "description": "Fast network logon cracker", "category": "password"},
        {"id": "john", "name": "John the Ripper", "description": "Password cracker", "category": "password"},
        {"id": "hashcat", "name": "Hashcat", "description": "Advanced password recovery", "category": "password"},
        {"id": "medusa", "name": "Medusa", "description": "Parallel password cracker", "category": "password"},
        {"id": "cewl", "name": "CeWL", "description": "Custom word list generator", "category": "password"},
    ],
    "exploitation": [
        {"id": "metasploit", "name": "Metasploit", "description": "Penetration testing framework", "category": "exploitation"},
        {"id": "searchsploit", "name": "SearchSploit", "description": "Exploit database search", "category": "exploitation"},
        {"id": "msfvenom", "name": "MSFvenom", "description": "Payload generator", "category": "exploitation"},
        {"id": "beef", "name": "BeEF", "description": "Browser exploitation framework", "category": "exploitation"},
    ],
    "wireless": [
        {"id": "aircrack-ng", "name": "Aircrack-ng", "description": "WiFi security auditing", "category": "wireless"},
        {"id": "reaver", "name": "Reaver", "description": "WPS brute force attack", "category": "wireless"},
        {"id": "wifite", "name": "Wifite", "description": "Automated wireless auditor", "category": "wireless"},
        {"id": "kismet", "name": "Kismet", "description": "Wireless network detector", "category": "wireless"},
    ],
    "recon": [
        {"id": "whois", "name": "Whois", "description": "Domain lookup", "category": "recon"},
        {"id": "theHarvester", "name": "theHarvester", "description": "OSINT gathering", "category": "recon"},
        {"id": "maltego", "name": "Maltego", "description": "OSINT and forensics", "category": "recon"},
        {"id": "recon-ng", "name": "Recon-ng", "description": "Web reconnaissance framework", "category": "recon"},
        {"id": "shodan", "name": "Shodan", "description": "Internet-connected device search", "category": "recon"},
    ],
}

# ============ MCP TOOL FUNCTIONS ============

def get_all_tools():
    """Get flat list of all tools"""
    all_tools = []
    for category, tools in KALI_TOOLS.items():
        all_tools.extend(tools)
    return all_tools

def simulate_tool_execution(tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Simulate Kali tool execution with realistic output"""
    import time
    import random
    
    start_time = time.time()
    
    # Simulated outputs for different tools
    tool_outputs = {
        "nmap": f"""Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for {params.get('target', '192.168.1.1')}
Host is up (0.00042s latency).
PORT     STATE SERVICE     VERSION
22/tcp   open  ssh         OpenSSH 8.9p1
80/tcp   open  http        Apache httpd 2.4.52
443/tcp  open  ssl/http    Apache httpd 2.4.52
3306/tcp open  mysql       MySQL 8.0.33

Nmap done: 1 IP address (1 host up) scanned in {random.uniform(2.5, 5.0):.2f} seconds""",
        
        "nikto": f"""- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          {params.get('target', '192.168.1.1')}
+ Target Hostname:    {params.get('target', 'target.local')}
+ Target Port:        {params.get('port', 80)}
+ Start Time:         {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
---------------------------------------------------------------------------
+ Server: Apache/2.4.52 (Ubuntu)
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: The X-Content-Type-Options header is not set.
+ /admin/: Directory indexing found.
+ OSVDB-3092: /admin/: This might be interesting.
+ OSVDB-3268: /icons/: Directory indexing found.
+ {random.randint(5, 15)} item(s) reported on remote host
+ End Time:           {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
---------------------------------------------------------------------------""",
        
        "sqlmap": f"""[*] starting @ {datetime.now().strftime('%H:%M:%S')}
[INFO] testing connection to the target URL
[INFO] checking if the target is protected by WAF/IPS
[INFO] testing if the target URL content is stable
[INFO] target URL content is stable
[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[INFO] {params.get('target', 'parameter')} appears to be 'AND boolean-based blind' injectable
[INFO] testing 'MySQL >= 5.0.12 AND time-based blind'
[INFO] {params.get('target', 'parameter')} appears to be 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] the back-end DBMS is MySQL
web server operating system: Linux Ubuntu
web application technology: Apache 2.4.52, PHP 8.1.2
back-end DBMS: MySQL >= 5.0.12
[*] ending @ {datetime.now().strftime('%H:%M:%S')}""",
        
        "hydra": f"""Hydra v9.4 (c) 2022 by van Hauser/THC
[DATA] max 16 tasks per 1 server, overall 16 tasks, {params.get('wordlist_size', 14344)} login tries
[DATA] attacking {params.get('service', 'ssh')}://{params.get('target', '192.168.1.1')}:{params.get('port', 22)}/
[STATUS] {random.randint(100, 500)}.00 tries/min, {random.randint(1000, 5000)} tries in 00:0{random.randint(1,5)}h
[{params.get('port', 22)}][{params.get('service', 'ssh')}] host: {params.get('target', '192.168.1.1')} login: admin password: {params.get('found_pass', 'admin123')}
1 of 1 target successfully completed, 1 valid password found""",
        
        "dirb": f"""-----------------
DIRB v2.22
By The Dark Raver
-----------------
START_TIME: {datetime.now().strftime('%c')}
URL_BASE: http://{params.get('target', '192.168.1.1')}/
WORDLIST_FILES: /usr/share/dirb/wordlists/common.txt
-----------------
GENERATED WORDS: 4612

---- Scanning URL: http://{params.get('target', '192.168.1.1')}/ ----
+ http://{params.get('target', '192.168.1.1')}/admin (CODE:301|SIZE:315)
+ http://{params.get('target', '192.168.1.1')}/backup (CODE:403|SIZE:277)
+ http://{params.get('target', '192.168.1.1')}/config (CODE:403|SIZE:277)
+ http://{params.get('target', '192.168.1.1')}/images (CODE:301|SIZE:315)
+ http://{params.get('target', '192.168.1.1')}/index.php (CODE:200|SIZE:4521)
-----------------
END_TIME: {datetime.now().strftime('%c')}
DOWNLOADED: 4612 - FOUND: 5""",
        
        "john": f"""Using default input encoding: UTF-8
Loaded {random.randint(1, 10)} password hashes with {random.randint(1, 5)} different salts
Will run {os.cpu_count()} OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
admin123         (admin)
password         (user1)
{random.randint(1, 3)}g 0:00:00:{random.randint(10, 59)} DONE
Session completed""",
        
        "netcat": f"""Connection to {params.get('target', '192.168.1.1')} {params.get('port', 80)} port [tcp/*] succeeded!
HTTP/1.1 200 OK
Server: Apache/2.4.52
Content-Type: text/html""",
        
        "whois": f"""Domain Name: {params.get('target', 'example.com')}
Registry Domain ID: 123456789_DOMAIN_COM-VRSN
Registrar: Example Registrar, Inc.
Creation Date: 2020-01-15T00:00:00Z
Registry Expiry Date: 2025-01-15T00:00:00Z
Registrar IANA ID: 12345
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
DNSSEC: unsigned""",
        
        "theHarvester": f"""*******************************************************************
*  _   _                                            _             *
* | |_| |__   ___    /\  /\__ _ _ ____   _____  ___| |_ ___ _ __  *
* | __| '_ \ / _ \  / /_/ / _` | '__\ \ / / _ \/ __| __/ _ \ '__| *
* | |_| | | |  __/ / __  / (_| | |   \ V /  __/\__ \ ||  __/ |    *
*  \__|_| |_|\___| \/ /_/ \__,_|_|    \_/ \___||___/\__\___|_|    *
*                                                                 *
* theHarvester 4.4.0                                              *
*******************************************************************

[*] Target: {params.get('target', 'example.com')}
[*] Searching: Google, Bing, LinkedIn

[*] Emails found: {random.randint(3, 10)}
------------------
admin@{params.get('target', 'example.com')}
info@{params.get('target', 'example.com')}
support@{params.get('target', 'example.com')}

[*] Hosts found: {random.randint(2, 5)}
------------------
mail.{params.get('target', 'example.com')}
www.{params.get('target', 'example.com')}
api.{params.get('target', 'example.com')}""",
    }
    
    # Default output for tools without specific simulation
    default_output = f"""[*] Executing {tool_name}...
[*] Parameters: {json.dumps(params, indent=2)}
[+] Tool execution completed successfully
[*] Analysis complete - check results above"""
    
    output = tool_outputs.get(tool_name, default_output)
    execution_time = time.time() - start_time + random.uniform(0.5, 2.0)
    
    return {
        "tool_name": tool_name,
        "status": "success",
        "output": output,
        "execution_time": execution_time
    }

async def execute_file_operation(operation: FileOperation) -> Dict[str, Any]:
    """Execute file system operations for MCP file access"""
    sandbox_dir = Path("/tmp/pentest_sandbox")
    sandbox_dir.mkdir(exist_ok=True)
    
    # Normalize path to stay within sandbox
    try:
        target_path = (sandbox_dir / operation.path.lstrip("/")).resolve()
        if not str(target_path).startswith(str(sandbox_dir)):
            return {"status": "error", "output": "Access denied: Path outside sandbox"}
    except Exception as e:
        return {"status": "error", "output": f"Invalid path: {str(e)}"}
    
    if operation.operation == "read":
        try:
            if target_path.exists():
                content = target_path.read_text()
                return {"status": "success", "output": content}
            else:
                return {"status": "error", "output": f"File not found: {operation.path}"}
        except Exception as e:
            return {"status": "error", "output": str(e)}
    
    elif operation.operation == "write":
        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(operation.content or "")
            return {"status": "success", "output": f"File written: {operation.path}"}
        except Exception as e:
            return {"status": "error", "output": str(e)}
    
    elif operation.operation == "list":
        try:
            if target_path.is_dir():
                items = []
                for item in target_path.iterdir():
                    items.append({
                        "name": item.name,
                        "type": "directory" if item.is_dir() else "file",
                        "size": item.stat().st_size if item.is_file() else 0
                    })
                return {"status": "success", "output": json.dumps(items, indent=2), "items": items}
            else:
                return {"status": "error", "output": "Not a directory"}
        except Exception as e:
            return {"status": "error", "output": str(e)}
    
    elif operation.operation == "delete":
        try:
            if target_path.exists():
                if target_path.is_file():
                    target_path.unlink()
                else:
                    import shutil
                    shutil.rmtree(target_path)
                return {"status": "success", "output": f"Deleted: {operation.path}"}
            else:
                return {"status": "error", "output": "File not found"}
        except Exception as e:
            return {"status": "error", "output": str(e)}
    
    elif operation.operation == "execute":
        # Simulate script execution with safety
        return {
            "status": "success", 
            "output": f"[SIMULATED] Script execution: {operation.path}\n[OUTPUT] Script ran successfully"
        }
    
    return {"status": "error", "output": "Unknown operation"}

# ============ LLM CHAT SETUP ============

SYSTEM_PROMPT = """You are NEXUS, an elite penetration testing AI assistant. You have access to a comprehensive suite of Kali Linux security tools through MCP (Model Context Protocol) tool calling.

Your capabilities include:
- Network scanning and enumeration (nmap, netcat, masscan)
- Web application security testing (nikto, sqlmap, dirb, gobuster)
- Password attacks (hydra, john, hashcat)
- Exploitation frameworks (metasploit, msfvenom)
- Wireless security (aircrack-ng, wifite)
- OSINT and reconnaissance (theHarvester, whois, shodan)
- Local file system access for storing results and running scripts

When users request security operations, you should:
1. Analyze the target and recommend appropriate tools
2. Explain the methodology and potential risks
3. Suggest tool parameters and options
4. Interpret results and provide actionable insights

Always emphasize ethical hacking principles:
- Only test systems you have permission to test
- Document all findings properly
- Follow responsible disclosure practices
- Protect sensitive data discovered during testing

You can execute tools by requesting tool calls, and the system will simulate their execution with realistic output. Format tool requests clearly so users understand what's being done.

Respond in a professional, concise manner befitting a security expert. Use technical terminology appropriately and explain concepts when needed."""

async def get_llm_response(session_id: str, user_message: str, history: List[Dict]) -> Dict[str, Any]:
    """Get response from LLM with context"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"response": "LLM API key not configured", "tool_calls": None}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Build context from recent history
        context = ""
        for msg in history[-10:]:
            role = "User" if msg.get('role') == 'user' else "NEXUS"
            context += f"{role}: {msg.get('content', '')}\n"
        
        # Add current message with context
        full_message = f"Previous conversation:\n{context}\n\nCurrent request: {user_message}"
        
        message = UserMessage(text=full_message)
        response = await chat.send_message(message)
        
        # Parse for tool calls in response
        tool_calls = []
        if "EXECUTE_TOOL:" in response:
            # Simple tool call detection
            lines = response.split('\n')
            for line in lines:
                if "EXECUTE_TOOL:" in line:
                    tool_info = line.replace("EXECUTE_TOOL:", "").strip()
                    tool_calls.append({"raw": tool_info})
        
        return {"response": response, "tool_calls": tool_calls if tool_calls else None}
    except Exception as e:
        logger.error(f"LLM error: {str(e)}")
        return {"response": f"Error communicating with AI: {str(e)}", "tool_calls": None}

# ============ API ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "NEXUS Pentest LLM API v1.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Chat endpoints
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process chat message and get AI response"""
    # Get chat history for context
    history = await db.chat_messages.find(
        {"session_id": request.session_id}, 
        {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    
    # Save user message
    user_msg = ChatMessage(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    user_doc = user_msg.model_dump()
    user_doc['timestamp'] = user_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_doc)
    
    # Get LLM response
    llm_result = await get_llm_response(request.session_id, request.message, history)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=request.session_id,
        role="assistant",
        content=llm_result["response"],
        tool_calls=llm_result["tool_calls"]
    )
    assistant_doc = assistant_msg.model_dump()
    assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    
    # Update session
    await db.sessions.update_one(
        {"id": request.session_id},
        {
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
            "$inc": {"message_count": 2}
        }
    )
    
    return ChatResponse(
        response=llm_result["response"],
        tool_calls=llm_result["tool_calls"],
        session_id=request.session_id
    )

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return {"messages": messages}

# Session endpoints
@api_router.post("/sessions")
async def create_session(name: str = "New Session"):
    """Create a new chat session"""
    session = Session(name=name)
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.sessions.insert_one(doc)
    return {"id": session.id, "name": session.name}

@api_router.get("/sessions")
async def get_sessions():
    """Get all chat sessions"""
    sessions = await db.sessions.find({}, {"_id": 0}).sort("updated_at", -1).to_list(50)
    return {"sessions": sessions}

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and its messages"""
    await db.sessions.delete_one({"id": session_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"status": "deleted"}

# Tools endpoints
@api_router.get("/tools")
async def get_tools():
    """Get all available Kali tools"""
    return {"tools": KALI_TOOLS, "categories": list(KALI_TOOLS.keys())}

@api_router.post("/tools/execute", response_model=ToolExecutionResponse)
async def execute_tool(request: ToolExecutionRequest):
    """Execute a Kali tool (simulated)"""
    # Log tool execution
    execution_log = {
        "id": str(uuid.uuid4()),
        "session_id": request.session_id,
        "tool_name": request.tool_name,
        "parameters": request.parameters,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "running"
    }
    await db.tool_executions.insert_one(execution_log)
    
    # Execute tool
    result = simulate_tool_execution(request.tool_name, request.parameters)
    
    # Update log with result
    await db.tool_executions.update_one(
        {"id": execution_log["id"]},
        {"$set": {"status": result["status"], "output": result["output"]}}
    )
    
    return ToolExecutionResponse(**result)

@api_router.get("/tools/executions/{session_id}")
async def get_tool_executions(session_id: str):
    """Get tool execution history for a session"""
    executions = await db.tool_executions.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    return {"executions": executions}

# File operations endpoints
@api_router.post("/files/operation")
async def file_operation(operation: FileOperation):
    """Execute file operation"""
    result = await execute_file_operation(operation)
    return result

@api_router.get("/files/list")
async def list_files(path: str = "/"):
    """List files in directory"""
    operation = FileOperation(operation="list", path=path)
    result = await execute_file_operation(operation)
    return result

@api_router.post("/files/init-sandbox")
async def init_sandbox():
    """Initialize sandbox with sample files"""
    sandbox_dir = Path("/tmp/pentest_sandbox")
    sandbox_dir.mkdir(exist_ok=True)
    
    # Create sample directories and files
    (sandbox_dir / "scans").mkdir(exist_ok=True)
    (sandbox_dir / "results").mkdir(exist_ok=True)
    (sandbox_dir / "scripts").mkdir(exist_ok=True)
    (sandbox_dir / "wordlists").mkdir(exist_ok=True)
    
    # Sample files
    (sandbox_dir / "scans" / "nmap_results.txt").write_text("# Nmap scan results\n# Run scans to populate")
    (sandbox_dir / "scripts" / "recon.sh").write_text("#!/bin/bash\n# Reconnaissance script\necho 'Starting recon...'")
    (sandbox_dir / "wordlists" / "common.txt").write_text("admin\npassword\n123456\nroot\ntest")
    (sandbox_dir / "README.txt").write_text("NEXUS Pentest Sandbox\n===================\nStore your scan results and scripts here.")
    
    return {"status": "success", "message": "Sandbox initialized"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import platform
import easysnmp
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any

app = FastAPI(title="The Eye API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar um pool de threads para operações bloqueantes
executor = ThreadPoolExecutor(max_workers=10)

async def run_command(command: list) -> Dict[str, Any]:
    loop = asyncio.get_event_loop()
    try:
        output = await loop.run_in_executor(executor, subprocess.check_output, command)
        return {"status": "success", "output": output.decode('utf-8')}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "output": str(e.output.decode('utf-8'))}
    except Exception as e:
        return {"status": "error", "output": str(e)}

@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do The Eye"}

@app.get("/api/ping/{ip}")
async def ping(ip: str):
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '4', ip]
    return await run_command(command)

@app.get("/api/traceroute/{ip}")
async def traceroute(ip: str):
    command = ['traceroute', ip] if platform.system().lower() != 'windows' else ['tracert', ip]
    return await run_command(command)

@app.get("/api/snmp-test/{ip}/{community}")
async def snmp_test(ip: str, community: str):
    try:
        # Criar uma sessão SNMP em uma thread separada
        loop = asyncio.get_event_loop()
        session = await loop.run_in_executor(
            executor,
            lambda: easysnmp.Session(hostname=ip, community=community, version=2)
        )
        
        # Executar a consulta SNMP em uma thread separada
        result = await loop.run_in_executor(
            executor,
            lambda: session.get('.1.3.6.1.2.1.1.1.0')
        )
        
        return {
            "status": "success",
            "output": f"Descrição do Sistema: {result.value}"
        }
    except easysnmp.EasySNMPError as e:
        return {
            "status": "error",
            "output": f"Erro SNMP: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "output": str(e)
        }

@app.on_event("shutdown")
async def shutdown_event():
    executor.shutdown(wait=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import asyncio
import aiohttp
from datetime import datetime
from typing import Optional, Dict, Any
from pysnmp.hlapi import *
from app.core.config import settings
from app.models.device import Device, DeviceStatus

class MonitoringService:
    @staticmethod
    async def ping_device(ip: str) -> bool:
        """Realiza ping no dispositivo"""
        try:
            # Usando aiohttp para fazer requisições HTTP como alternativa ao ping
            # (mais adequado para ambiente web)
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://{ip}", timeout=settings.PING_TIMEOUT) as response:
                    return response.status < 400
        except:
            return False

    @staticmethod
    def snmp_get(ip: str, community: str, oid: str) -> Optional[str]:
        """Realiza consulta SNMP no dispositivo"""
        try:
            errorIndication, errorStatus, errorIndex, varBinds = next(
                getCmd(SnmpEngine(),
                       CommunityData(community),
                       UdpTransportTarget((ip, settings.SNMP_PORT)),
                       ContextData(),
                       ObjectType(ObjectIdentity(oid)))
            )
            
            if errorIndication:
                return None
            elif errorStatus:
                return None
            else:
                for varBind in varBinds:
                    return str(varBind[1])
        except:
            return None

    @staticmethod
    async def check_device(device: Device) -> Dict[str, Any]:
        """Verifica o status do dispositivo usando ping e SNMP"""
        status = DeviceStatus.UNKNOWN
        last_seen = None
        device_info = {}

        # Verifica via ping
        is_ping_ok = await MonitoringService.ping_device(device.ip_address)
        
        if is_ping_ok:
            status = DeviceStatus.ONLINE
            last_seen = datetime.utcnow()
            
            # Se SNMP estiver habilitado, tenta coletar informações
            if device.snmp_enabled and device.snmp_community:
                # OIDs comuns para diferentes fabricantes
                oids = {
                    "sysDescr": "1.3.6.1.2.1.1.1.0",
                    "sysUpTime": "1.3.6.1.2.1.1.3.0",
                    "sysContact": "1.3.6.1.2.1.1.4.0",
                    "sysName": "1.3.6.1.2.1.1.5.0"
                }
                
                for key, oid in oids.items():
                    value = MonitoringService.snmp_get(device.ip_address, device.snmp_community, oid)
                    if value:
                        device_info[key] = value
        else:
            status = DeviceStatus.OFFLINE

        return {
            "status": status,
            "last_seen": last_seen,
            "device_info": device_info
        }

    @staticmethod
    async def scan_network(network: str) -> list:
        """Escaneia uma rede em busca de dispositivos"""
        # Implementação do scan de rede
        # TODO: Implementar scan de rede usando nmap ou similar
        return [] 
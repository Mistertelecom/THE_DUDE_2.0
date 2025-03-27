export type DeviceType = 'router' | 'switch' | 'ap' | 'server' | 'client';
export type DeviceStatus = 'online' | 'offline' | 'warning';
export type DeviceVendor = 'ubiquiti' | 'mikrotik' | 'cisco' | 'mimosa' | 'unknown';

export interface DeviceService {
  type: 'ping' | 'snmp' | 'lan' | 'uptime' | 'via';
  enabled: boolean;
  interval: number; // em segundos
  lastCheck?: Date;
  lastResult?: string;
  displayOnDevice?: boolean;
}

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  connections: string[];
  ip?: string;
  snmpCommunity?: string;
  status?: DeviceStatus;
  vendor?: DeviceVendor;
  services: DeviceService[];
  color?: string;
  network?: string;
  uptime?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  lastPing?: Date;
  lastSNMP?: Date;
  lastLAN?: Date;
  lastVIA?: Date;
  pingInterval?: number; // intervalo em segundos para verificação de ping
  pingAttempts?: number; // número de tentativas antes de declarar offline
}

export interface DevicePosition {
  x: number;
  y: number;
}

export interface DeviceConnections {
  [key: string]: string[];
} 
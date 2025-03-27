import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Box, Paper, IconButton, Tooltip, Menu, MenuItem, AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  DeviceHub as DeviceHubIcon,
  Router as RouterIcon,
  Wifi as WifiIcon,
  Storage as StorageIcon,
  Computer as ComputerIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkCheckIcon,
  BugReport as BugReportIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import DeviceSettings from './DeviceSettings';
import InfoWindow from './InfoWindow';
import DeviceServices from './DeviceServices';
import GlobalSettings, { GlobalSettings as GlobalSettingsType } from './GlobalSettings';
import { Device, DevicePosition, DeviceConnections, DeviceVendor } from '../types/device';

interface NetworkCanvasProps {
  onDeviceSelect?: (device: Device | null) => void;
  onThemeChange?: (isDark: boolean) => void;
}

const NetworkCanvas: React.FC<NetworkCanvasProps> = ({ onDeviceSelect, onThemeChange }) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    device: Device | null;
  }>({
    mouseX: 0,
    mouseY: 0,
    device: null,
  });
  const [infoWindow, setInfoWindow] = useState<{
    open: boolean;
    title: string;
    content: string;
    device: Device | null;
  }>({
    open: false,
    title: '',
    content: '',
    device: null,
  });
  const [servicesOpen, setServicesOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettingsType | null>(null);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [pingAttempts, setPingAttempts] = useState<{ [key: string]: number }>({});
  const [pingResults, setPingResults] = useState<{ [key: string]: boolean[] }>({});
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // Cache de posições e conexões para melhor performance
  const devicePositions = useMemo(() => {
    const positions = new Map<string, DevicePosition>();
    devices.forEach(device => {
      positions.set(device.id, { x: device.x, y: device.y });
    });
    return positions;
  }, [devices]);

  const deviceConnections = useMemo(() => {
    const connections = new Map<string, string[]>();
    devices.forEach(device => {
      connections.set(device.id, device.connections);
    });
    return connections;
  }, [devices]);

  // Otimização: Função para verificar colisão com dispositivo
  const findDeviceAtPosition = useCallback((x: number, y: number) => {
    const deviceIds = Array.from(devicePositions.keys());
    for (let i = 0; i < deviceIds.length; i++) {
      const id = deviceIds[i];
      const pos = devicePositions.get(id);
      if (!pos) continue;
      
      const dx = pos.x - x;
      const dy = pos.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= 20) {
        return devices.find(d => d.id === id) || null;
      }
    }
    return null;
  }, [devicePositions, devices]);

  // Otimização: Função para atualizar posição do dispositivo
  const updateDevicePosition = useCallback((deviceId: string, x: number, y: number) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, x, y }
          : device
      )
    );
  }, []);

  // Otimização: Função para adicionar conexão
  const addConnection = useCallback((sourceId: string, targetId: string) => {
    setDevices(prevDevices => 
      prevDevices.map(device => {
        if (device.id === sourceId) {
          return {
            ...device,
            connections: [...device.connections, targetId]
          };
        }
        if (device.id === targetId) {
          return {
            ...device,
            connections: [...device.connections, sourceId]
          };
        }
        return device;
      })
    );
  }, []);

  // Otimização: Função para remover conexão
  const removeConnection = useCallback((sourceId: string, targetId: string) => {
    setDevices(prevDevices => 
      prevDevices.map(device => {
        if (device.id === sourceId) {
          return {
            ...device,
            connections: device.connections.filter(id => id !== targetId)
          };
        }
        if (device.id === targetId) {
          return {
            ...device,
            connections: device.connections.filter(id => id !== sourceId)
          };
        }
        return device;
      })
    );
  }, []);

  // Carregar configurações globais
  useEffect(() => {
    const savedSettings = localStorage.getItem('globalSettings');
    if (savedSettings) {
      setGlobalSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Função para obter configurações do dispositivo com prioridade
  const getDeviceSettings = useCallback((device: Device) => {
    if (!globalSettings) return null;

    const deviceServices = device.services || [];
    const defaultServices = globalSettings.defaultServices;

    return {
      services: deviceServices.map(service => {
        const defaultService = defaultServices.find(s => s.type === service.type);
        return {
          ...defaultService,
          ...service,
          enabled: service.enabled ?? defaultService?.enabled ?? false,
          interval: service.interval ?? defaultService?.interval ?? 300,
          displayOnDevice: service.displayOnDevice ?? defaultService?.displayOnDevice ?? false,
        };
      }),
      pingInterval: device.pingInterval ?? globalSettings.defaultPingInterval,
      pingAttempts: device.pingAttempts ?? globalSettings.defaultPingAttempts,
      vendor: device.vendor ?? globalSettings.defaultVendor,
      snmpCommunity: device.snmpCommunity ?? globalSettings.defaultSNMPCommunity,
    };
  }, [globalSettings]);

  // Função para executar ping
  const executePing = useCallback(async (device: Device) => {
    if (!device.ip) return;

    const settings = getDeviceSettings(device);
    if (!settings) return;

    const pingService = settings.services.find(s => s.type === 'ping');
    if (!pingService?.enabled) return;

    try {
      const response = await fetch(`http://localhost:8000/api/ping/${device.ip}`);
      const data = await response.json();
      const isSuccess = data.output.includes('bytes from');

      // Atualizar resultados do ping
      setPingResults(prev => ({
        ...prev,
        [device.id]: [...(prev[device.id] || []).slice(-settings.pingAttempts), isSuccess],
      }));

      // Verificar se o dispositivo está offline
      const results = pingResults[device.id] || [];
      const failedAttempts = results.filter(r => !r).length;

      if (failedAttempts >= settings.pingAttempts) {
        device.status = 'offline';
      } else if (isSuccess) {
        device.status = 'online';
      }

      setDevices(prevDevices => 
        prevDevices.map(d => 
          d.id === device.id ? { ...device } : d
        )
      );
    } catch (error) {
      console.error(`Erro ao executar ping para ${device.name}:`, error);
    }
  }, [getDeviceSettings, pingResults]);

  // Efeito para executar ping periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      devices.forEach(device => {
        const settings = getDeviceSettings(device);
        if (settings) {
          const pingService = settings.services.find(s => s.type === 'ping');
          if (pingService?.enabled) {
            executePing(device);
          }
        }
      });
    }, 1000); // Verificar a cada segundo

    return () => clearInterval(interval);
  }, [devices, getDeviceSettings, executePing]);

  // Otimização: Função para adicionar dispositivo com configurações globais
  const handleAddDevice = useCallback((type: Device['type'], x: number, y: number) => {
    const newDevice: Device = {
      id: `device-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${devices.length + 1}`,
      x,
      y,
      connections: [],
      status: 'online',
      services: globalSettings?.defaultServices.map(service => ({
        ...service,
        enabled: globalSettings.autoStartServices ? service.enabled : false,
      })) || [],
      vendor: globalSettings?.defaultVendor || 'unknown',
      snmpCommunity: globalSettings?.defaultSNMPCommunity,
    };
    setDevices(prevDevices => [...prevDevices, newDevice]);
  }, [devices.length, globalSettings]);

  // Otimização: Função para remover dispositivo
  const handleDeleteDevice = useCallback((deviceId: string) => {
    setDevices(prevDevices => 
      prevDevices.filter(device => device.id !== deviceId)
    );
    setSelectedDevice(null);
  }, []);

  // Otimização: Função para editar dispositivo
  const handleEditDevice = useCallback((device: Device) => {
    setSelectedDevice(device);
    setSettingsOpen(true);
  }, []);

  // Otimização: Função para salvar dispositivo
  const handleSaveDevice = useCallback((updatedDevice: Device) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === updatedDevice.id ? updatedDevice : device
      )
    );
    setSelectedDevice(null);
    setSettingsOpen(false);
  }, []);

  // Otimização: Função para iniciar conexão
  const handleStartConnection = useCallback((deviceId: string) => {
    setIsConnecting(true);
    setConnectionStart(deviceId);
  }, []);

  // Otimização: Função para finalizar conexão
  const handleEndConnection = useCallback((deviceId: string) => {
    if (isConnecting && connectionStart && connectionStart !== deviceId) {
      addConnection(connectionStart, deviceId);
    }
    setIsConnecting(false);
    setConnectionStart(null);
  }, [isConnecting, connectionStart, addConnection]);

  // Otimização: Função para lidar com clique no canvas
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedDevice = findDeviceAtPosition(x, y);
    const currentTime = new Date().getTime();

    if (clickedDevice) {
      if (isConnecting && connectionStart) {
        handleEndConnection(clickedDevice.id);
      } else {
        setSelectedDevice(clickedDevice);
        onDeviceSelect?.(clickedDevice);
        
        // Verificar se é um duplo clique (menos de 300ms entre os cliques)
        if (currentTime - lastClickTime < 300) {
          setSettingsOpen(true);
        }
        setLastClickTime(currentTime);
      }
    } else {
      setSelectedDevice(null);
      onDeviceSelect?.(null);
      setSettingsOpen(false);
    }
  }, [isConnecting, connectionStart, findDeviceAtPosition, handleEndConnection, onDeviceSelect, lastClickTime]);

  // Otimização: Função para lidar com mouse down no canvas
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedDevice = findDeviceAtPosition(x, y);
    if (clickedDevice) {
      setIsDragging(true);
      setDragStart({ x: clickedDevice.x, y: clickedDevice.y });
      setSelectedDevice(clickedDevice);
    }
  }, [findDeviceAtPosition]);

  // Otimização: Função para lidar com mouse move no canvas
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    updateDevicePosition(selectedDevice.id, x, y);
  }, [isDragging, selectedDevice, updateDevicePosition]);

  // Otimização: Função para lidar com mouse up no canvas
  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getDeviceColor = useMemo(() => (device: Device) => {
    if (device.color) return device.color;
    
    switch (device.status) {
      case 'online':
        return '#4CAF50'; // Verde
      case 'offline':
        return '#F44336'; // Vermelho
      case 'warning':
        return '#2196F3'; // Azul
      default:
        switch (device.type) {
          case 'router':
            return '#2196F3';
          case 'switch':
            return '#4CAF50';
          case 'ap':
            return '#FFC107';
          case 'server':
            return '#9C27B0';
          case 'client':
            return '#FF5722';
          default:
            return '#9E9E9E';
        }
    }
  }, []);

  const handlePing = useCallback(async (device: Device) => {
    if (!device.ip) {
      setInfoWindow({
        open: true,
        title: 'Erro',
        content: 'Por favor, configure o IP do dispositivo primeiro.',
        device,
      });
      return;
    }

    // Abrir janela imediatamente
    setInfoWindow({
      open: true,
      title: 'Ping em andamento...',
      content: 'Executando ping...',
      device,
    });

    try {
      const response = await fetch(`http://localhost:8000/api/ping/${device.ip}`);
      const data = await response.json();
      
      // Atualizar janela com o resultado
      setInfoWindow(prev => ({
        ...prev,
        title: 'Resultado do Ping',
        content: data.output,
      }));
    } catch (error) {
      setInfoWindow(prev => ({
        ...prev,
        title: 'Erro',
        content: 'Erro ao executar ping. Verifique se o backend está rodando.',
      }));
    }
  }, []);

  const handleTraceroute = useCallback(async (device: Device) => {
    if (!device.ip) {
      setInfoWindow({
        open: true,
        title: 'Erro',
        content: 'Por favor, configure o IP do dispositivo primeiro.',
        device,
      });
      return;
    }

    // Abrir janela imediatamente
    setInfoWindow({
      open: true,
      title: 'Traceroute em andamento...',
      content: 'Executando traceroute...',
      device,
    });

    try {
      const response = await fetch(`http://localhost:8000/api/traceroute/${device.ip}`);
      const data = await response.json();
      
      // Atualizar janela com o resultado
      setInfoWindow(prev => ({
        ...prev,
        title: 'Resultado do Traceroute',
        content: data.output,
      }));
    } catch (error) {
      setInfoWindow(prev => ({
        ...prev,
        title: 'Erro',
        content: 'Erro ao executar traceroute. Verifique se o backend está rodando.',
      }));
    }
  }, []);

  const handleSNMPTest = useCallback(async (device: Device) => {
    if (!device.ip || !device.snmpCommunity) {
      setInfoWindow({
        open: true,
        title: 'Erro',
        content: 'Por favor, configure o IP e a comunidade SNMP do dispositivo primeiro.',
        device,
      });
      return;
    }

    // Abrir janela imediatamente
    setInfoWindow({
      open: true,
      title: 'Teste SNMP em andamento...',
      content: 'Executando teste SNMP...',
      device,
    });

    try {
      const response = await fetch(
        `http://localhost:8000/api/snmp-test/${device.ip}/${device.snmpCommunity}`
      );
      const data = await response.json();
      
      // Atualizar janela com o resultado
      setInfoWindow(prev => ({
        ...prev,
        title: 'Resultado do Teste SNMP',
        content: data.output,
      }));
    } catch (error) {
      setInfoWindow(prev => ({
        ...prev,
        title: 'Erro',
        content: 'Erro ao executar teste SNMP. Verifique se o backend está rodando.',
      }));
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedDevice = devices.find(device => {
      const dx = device.x - x;
      const dy = device.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedDevice) {
      setContextMenu({
        mouseX: e.clientX,
        mouseY: e.clientY,
        device: clickedDevice,
      });
    }
  }, [devices]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({
      mouseX: 0,
      mouseY: 0,
      device: null,
    });
  }, []);

  const handleThemeChange = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  }, [isDarkMode, onThemeChange]);

  const deviceTypes = useMemo(() => [
    { type: 'router', icon: <RouterIcon />, label: 'Adicionar Roteador' },
    { type: 'switch', icon: <DeviceHubIcon />, label: 'Adicionar Switch' },
    { type: 'ap', icon: <WifiIcon />, label: 'Adicionar Access Point' },
    { type: 'server', icon: <StorageIcon />, label: 'Adicionar Servidor' },
    { type: 'client', icon: <ComputerIcon />, label: 'Adicionar Cliente' },
  ], []);

  // Função para executar serviços de monitoramento
  const executeDeviceServices = useCallback(async (device: Device) => {
    if (!device.services) return;

    for (const service of device.services) {
      if (!service.enabled) continue;

      const now = new Date();
      const lastCheck = service.lastCheck ? new Date(service.lastCheck) : new Date(0);
      const timeSinceLastCheck = (now.getTime() - lastCheck.getTime()) / 1000;

      if (timeSinceLastCheck >= service.interval) {
        try {
          let result = '';
          switch (service.type) {
            case 'ping':
              if (device.ip) {
                const response = await fetch(`http://localhost:8000/api/ping/${device.ip}`);
                const data = await response.json();
                result = data.output;
                device.lastPing = now;
              }
              break;
            case 'snmp':
              if (device.ip && device.snmpCommunity) {
                const response = await fetch(
                  `http://localhost:8000/api/snmp-test/${device.ip}/${device.snmpCommunity}`
                );
                const data = await response.json();
                result = data.output;
                device.lastSNMP = now;
              }
              break;
            case 'lan':
              if (device.ip) {
                const response = await fetch(`http://localhost:8000/api/lan-test/${device.ip}`);
                const data = await response.json();
                result = data.output;
                device.lastLAN = now;
              }
              break;
            case 'uptime':
              if (device.ip && device.snmpCommunity) {
                const response = await fetch(
                  `http://localhost:8000/api/uptime/${device.ip}/${device.snmpCommunity}`
                );
                const data = await response.json();
                result = data.output;
                device.uptime = result;
              }
              break;
            case 'via':
              if (device.ip) {
                const response = await fetch(`http://localhost:8000/api/via-test/${device.ip}`);
                const data = await response.json();
                result = data.output;
                device.lastVIA = now;
              }
              break;
          }

          service.lastCheck = now;
          service.lastResult = result;

          // Atualizar status do dispositivo baseado nos resultados
          if (service.type === 'ping' && result.includes('timeout')) {
            device.status = 'offline';
          } else if (service.type === 'ping' && result.includes('unreachable')) {
            device.status = 'warning';
          } else if (service.type === 'ping' && result.includes('bytes from')) {
            device.status = 'online';
          }

          setDevices(prevDevices => 
            prevDevices.map(d => 
              d.id === device.id ? { ...device } : d
            )
          );
        } catch (error) {
          console.error(`Erro ao executar serviço ${service.type} para ${device.name}:`, error);
        }
      }
    }
  }, []);

  // Efeito para executar serviços periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      devices.forEach(device => {
        if (device.services) {
          executeDeviceServices(device);
        }
      });
    }, 1000); // Verificar a cada segundo

    return () => clearInterval(interval);
  }, [devices, executeDeviceServices]);

  // Otimização: Função de renderização usando requestAnimationFrame
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar grid apenas se houver dispositivos
    if (devices.length > 0) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? '#333' : '#ddd';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    }

    // Desenhar conexões
    const deviceIds = Array.from(deviceConnections.keys());
    for (let i = 0; i < deviceIds.length; i++) {
      const id = deviceIds[i];
      const connections = deviceConnections.get(id);
      if (!connections) continue;

      const sourcePos = devicePositions.get(id);
      if (!sourcePos) continue;

      for (let j = 0; j < connections.length; j++) {
        const connectionId = connections[j];
        const targetPos = devicePositions.get(connectionId);
        if (!targetPos) continue;

        ctx.beginPath();
        ctx.strokeStyle = theme.palette.mode === 'dark' ? '#666' : '#999';
        ctx.lineWidth = 2;
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    }

    // Desenhar dispositivos
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const pos = devicePositions.get(device.id);
      if (!pos) continue;

      const color = getDeviceColor(device);
      ctx.fillStyle = device === selectedDevice ? theme.palette.primary.light : color;
      ctx.strokeStyle = device === selectedDevice ? theme.palette.primary.main : theme.palette.mode === 'dark' ? '#666' : '#999';
      ctx.lineWidth = device === selectedDevice ? 2 : 1;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Desenhar nome do dispositivo
      ctx.fillStyle = theme.palette.text.primary;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(device.name, pos.x, pos.y + 35);

      // Desenhar informações dos serviços
      if (device.services) {
        let yOffset = 50;
        ctx.font = '10px Arial';
        
        device.services.forEach(service => {
          if (service.displayOnDevice && service.lastResult) {
            let text = '';
            switch (service.type) {
              case 'uptime':
                text = `Uptime: ${device.uptime || 'N/A'}`;
                break;
              case 'ping':
                text = `Ping: ${service.lastResult.split('\n')[0]}`;
                break;
              case 'snmp':
                text = `SNMP: ${service.lastResult.split('\n')[0]}`;
                break;
              case 'lan':
                text = `LAN: ${service.lastResult.split('\n')[0]}`;
                break;
              case 'via':
                text = `VIA: ${service.lastResult.split('\n')[0]}`;
                break;
            }
            if (text) {
              ctx.fillText(text, pos.x, pos.y + yOffset);
              yOffset += 15;
            }
          }
        });
      }
    }

    // Agendar próxima renderização
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [devices, selectedDevice, theme, devicePositions, deviceConnections, getDeviceColor]);

  // Iniciar loop de renderização
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            The Dude 2.0
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Configurações Globais">
              <IconButton 
                onClick={() => setGlobalSettingsOpen(true)} 
                color="primary"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            {deviceTypes.map(({ type, icon, label }) => (
              <Tooltip key={type} title={label}>
                <IconButton 
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    handleAddDevice(type as Device['type'], rect.width / 2, rect.height / 2);
                  }} 
                  color="primary"
                >
                  {icon}
                </IconButton>
              </Tooltip>
            ))}
            <IconButton onClick={handleThemeChange} color="primary">
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Paper sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight - 64}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </Paper>

      {selectedDevice && (
        <Paper sx={{ position: 'absolute', bottom: 16, left: 16, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Serviços">
              <IconButton 
                onClick={() => setServicesOpen(true)} 
                color="primary"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ping">
              <IconButton 
                onClick={() => handlePing(selectedDevice)} 
                color="primary"
              >
                <SpeedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Traceroute">
              <IconButton 
                onClick={() => handleTraceroute(selectedDevice)} 
                color="primary"
              >
                <NetworkCheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="SNMP Test">
              <IconButton 
                onClick={() => handleSNMPTest(selectedDevice)} 
                color="primary"
              >
                <BugReportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Conectar">
              <IconButton 
                onClick={() => handleStartConnection(selectedDevice.id)} 
                color="primary"
              >
                <DeviceHubIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton 
                onClick={() => handleEditDevice(selectedDevice)} 
                color="primary"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton 
                onClick={() => handleDeleteDevice(selectedDevice.id)} 
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      )}

      <DeviceSettings
        open={settingsOpen}
        device={selectedDevice}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveDevice}
      />

      <DeviceServices
        open={servicesOpen}
        device={selectedDevice}
        onClose={() => setServicesOpen(false)}
        onSave={handleSaveDevice}
      />

      <InfoWindow
        open={infoWindow.open}
        title={infoWindow.title}
        content={infoWindow.content}
        device={infoWindow.device}
        onClose={() => setInfoWindow(prev => ({ ...prev, open: false }))}
      />

      <GlobalSettings
        open={globalSettingsOpen}
        onClose={() => setGlobalSettingsOpen(false)}
        onSave={setGlobalSettings}
      />
    </Box>
  );
};

export default NetworkCanvas; 
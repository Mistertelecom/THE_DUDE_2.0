import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface Device {
  id: string;
  type: 'router' | 'switch' | 'ap' | 'server' | 'client';
  name: string;
  x: number;
  y: number;
  connections: string[];
  ip?: string;
  snmpCommunity?: string;
  status?: 'online' | 'offline' | 'warning';
  uptime?: string;
  cpuUsage?: number;
  memoryUsage?: number;
}

interface DeviceDetailsProps {
  device: Device | null;
  onUpdate: (device: Device) => void;
}

const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onUpdate }) => {
  if (!device) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6">Selecione um dispositivo</Typography>
      </Paper>
    );
  }

  const handleChange = (field: keyof Device, value: any) => {
    onUpdate({ ...device, [field]: value });
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Detalhes do Dispositivo
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nome"
            value={device.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={device.type}
              label="Tipo"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <MenuItem value="router">Roteador</MenuItem>
              <MenuItem value="switch">Switch</MenuItem>
              <MenuItem value="ap">Access Point</MenuItem>
              <MenuItem value="server">Servidor</MenuItem>
              <MenuItem value="client">Cliente</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="IP"
            value={device.ip || ''}
            onChange={(e) => handleChange('ip', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Comunidade SNMP"
            value={device.snmpCommunity || ''}
            onChange={(e) => handleChange('snmpCommunity', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={device.status || 'offline'}
              label="Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
              <MenuItem value="warning">Atenção</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {device.status === 'online' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Uptime</Typography>
              <Typography>{device.uptime || 'N/A'}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="subtitle2">CPU</Typography>
              <Typography>{device.cpuUsage ? `${device.cpuUsage}%` : 'N/A'}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="subtitle2">Memória</Typography>
              <Typography>{device.memoryUsage ? `${device.memoryUsage}%` : 'N/A'}</Typography>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                // TODO: Implementar monitoramento
              }}
            >
              Monitorar
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => {
                // TODO: Implementar ping
              }}
            >
              Ping
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DeviceDetails; 
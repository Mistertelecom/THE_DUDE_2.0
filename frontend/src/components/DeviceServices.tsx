import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Device, DeviceService, DeviceVendor } from '../types/device';

interface DeviceServicesProps {
  open: boolean;
  device: Device | null;
  onClose: () => void;
  onSave: (device: Device) => void;
}

const defaultServices: DeviceService[] = [
  { type: 'ping', enabled: false, interval: 60 },
  { type: 'snmp', enabled: false, interval: 300 },
  { type: 'lan', enabled: false, interval: 300 },
  { type: 'uptime', enabled: false, interval: 300 },
  { type: 'via', enabled: false, interval: 300 },
];

const DeviceServices: React.FC<DeviceServicesProps> = ({ open, device, onClose, onSave }) => {
  const [editedDevice, setEditedDevice] = useState<Device | null>(null);
  const [services, setServices] = useState<DeviceService[]>([]);
  const [pingSettings, setPingSettings] = useState({
    interval: 5,
    attempts: 4,
  });

  useEffect(() => {
    if (device) {
      setEditedDevice(device);
      setServices(device.services || defaultServices);
      setPingSettings({
        interval: device.pingInterval || 5,
        attempts: device.pingAttempts || 4,
      });
    }
  }, [device]);

  const handleServiceToggle = (serviceType: DeviceService['type']) => {
    setServices(prev => 
      prev.map(service => 
        service.type === serviceType 
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  };

  const handleIntervalChange = (serviceType: DeviceService['type'], value: string) => {
    const interval = parseInt(value) || 0;
    setServices(prev => 
      prev.map(service => 
        service.type === serviceType 
          ? { ...service, interval }
          : service
      )
    );
  };

  const handleDisplayToggle = (serviceType: DeviceService['type']) => {
    setServices(prev => 
      prev.map(service => 
        service.type === serviceType 
          ? { ...service, displayOnDevice: !service.displayOnDevice }
          : service
      )
    );
  };

  const handleVendorChange = (vendor: DeviceVendor) => {
    if (editedDevice) {
      setEditedDevice({ ...editedDevice, vendor });
    }
  };

  const handleSave = () => {
    if (editedDevice) {
      const updatedDevice = {
        ...editedDevice,
        services,
        pingInterval: pingSettings.interval,
        pingAttempts: pingSettings.attempts,
      };
      onSave(updatedDevice);
      onClose();
    }
  };

  if (!editedDevice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Serviços do Dispositivo</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Fabricante</InputLabel>
            <Select
              value={editedDevice.vendor || 'unknown'}
              onChange={(e) => handleVendorChange(e.target.value as DeviceVendor)}
              label="Fabricante"
            >
              <MenuItem value="ubiquiti">Ubiquiti</MenuItem>
              <MenuItem value="mikrotik">Mikrotik</MenuItem>
              <MenuItem value="cisco">Cisco</MenuItem>
              <MenuItem value="mimosa">Mimosa</MenuItem>
              <MenuItem value="unknown">Desconhecido</MenuItem>
            </Select>
          </FormControl>

          {services.map(service => (
            <Box key={service.type} sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {service.type.toUpperCase()}
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={service.enabled}
                      onChange={() => handleServiceToggle(service.type)}
                    />
                  }
                  label="Ativar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={service.displayOnDevice}
                      onChange={() => handleDisplayToggle(service.type)}
                    />
                  }
                  label="Exibir no dispositivo"
                />
                <TextField
                  label="Intervalo (segundos)"
                  type="number"
                  value={service.interval}
                  onChange={(e) => handleIntervalChange(service.type, e.target.value)}
                  fullWidth
                  size="small"
                />
                {service.type === 'ping' && (
                  <>
                    <TextField
                      label="Tentativas antes de declarar offline"
                      type="number"
                      value={pingSettings.attempts}
                      onChange={(e) => setPingSettings(prev => ({ ...prev, attempts: parseInt(e.target.value) || 4 }))}
                      fullWidth
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      O dispositivo será marcado como offline após {pingSettings.attempts} tentativas falhas consecutivas
                    </Typography>
                  </>
                )}
                {service.lastCheck && (
                  <Typography variant="caption" color="text.secondary">
                    Última verificação: {new Date(service.lastCheck).toLocaleString()}
                  </Typography>
                )}
                {service.lastResult && (
                  <Typography variant="caption" color="text.secondary">
                    Último resultado: {service.lastResult}
                  </Typography>
                )}
              </FormGroup>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceServices; 
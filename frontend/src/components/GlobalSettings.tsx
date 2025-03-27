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
import { DeviceService, DeviceVendor } from '../types/device';

interface GlobalSettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: GlobalSettings) => void;
}

export interface GlobalSettings {
  defaultServices: DeviceService[];
  defaultPingInterval: number;
  defaultPingAttempts: number;
  defaultSNMPInterval: number;
  defaultSNMPCommunity: string;
  defaultVendor: DeviceVendor;
  autoStartServices: boolean;
}

const defaultSettings: GlobalSettings = {
  defaultServices: [
    { type: 'ping', enabled: true, interval: 5, displayOnDevice: true },
    { type: 'snmp', enabled: false, interval: 300 },
    { type: 'lan', enabled: false, interval: 300 },
    { type: 'uptime', enabled: false, interval: 300 },
    { type: 'via', enabled: false, interval: 300 },
  ],
  defaultPingInterval: 5,
  defaultPingAttempts: 4,
  defaultSNMPInterval: 300,
  defaultSNMPCommunity: 'public',
  defaultVendor: 'unknown',
  autoStartServices: true,
};

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ open, onClose, onSave }) => {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    const savedSettings = localStorage.getItem('globalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    // Salvar configurações no localStorage
    localStorage.setItem('globalSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const handleServiceToggle = (serviceType: DeviceService['type']) => {
    setSettings(prev => ({
      ...prev,
      defaultServices: prev.defaultServices.map(service =>
        service.type === serviceType
          ? { ...service, enabled: !service.enabled }
          : service
      ),
    }));
  };

  const handleDisplayToggle = (serviceType: DeviceService['type']) => {
    setSettings(prev => ({
      ...prev,
      defaultServices: prev.defaultServices.map(service =>
        service.type === serviceType
          ? { ...service, displayOnDevice: !service.displayOnDevice }
          : service
      ),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configurações Globais</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoStartServices}
                onChange={(e) => setSettings(prev => ({ ...prev, autoStartServices: e.target.checked }))}
              />
            }
            label="Iniciar serviços automaticamente em novos dispositivos"
          />

          <FormControl fullWidth>
            <InputLabel>Fabricante Padrão</InputLabel>
            <Select
              value={settings.defaultVendor}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultVendor: e.target.value }))}
              label="Fabricante Padrão"
            >
              <MenuItem value="ubiquiti">Ubiquiti</MenuItem>
              <MenuItem value="mikrotik">Mikrotik</MenuItem>
              <MenuItem value="cisco">Cisco</MenuItem>
              <MenuItem value="mimosa">Mimosa</MenuItem>
              <MenuItem value="unknown">Desconhecido</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Comunidade SNMP Padrão"
            value={settings.defaultSNMPCommunity}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultSNMPCommunity: e.target.value }))}
            fullWidth
          />

          <Typography variant="subtitle1" gutterBottom>
            Configurações de Ping
          </Typography>
          <TextField
            label="Intervalo (segundos)"
            type="number"
            value={settings.defaultPingInterval}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultPingInterval: parseInt(e.target.value) || 5 }))}
            fullWidth
            size="small"
          />
          <TextField
            label="Tentativas antes de declarar offline"
            type="number"
            value={settings.defaultPingAttempts}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultPingAttempts: parseInt(e.target.value) || 4 }))}
            fullWidth
            size="small"
          />

          <Typography variant="subtitle1" gutterBottom>
            Serviços Padrão
          </Typography>
          {settings.defaultServices.map(service => (
            <Box key={service.type} sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
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
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultServices: prev.defaultServices.map(s =>
                      s.type === service.type
                        ? { ...s, interval: parseInt(e.target.value) || 300 }
                        : s
                    ),
                  }))}
                  fullWidth
                  size="small"
                />
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

export default GlobalSettings; 
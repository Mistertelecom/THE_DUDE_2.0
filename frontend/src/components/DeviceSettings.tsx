import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import { Device } from '../types/device';

interface DeviceSettingsProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
}

const getDefaultColor = (status?: Device['status']): string => {
  switch (status) {
    case 'online':
      return '#4CAF50'; // Verde
    case 'offline':
      return '#F44336'; // Vermelho
    case 'warning':
      return '#2196F3'; // Azul
    default:
      return '#9E9E9E'; // Cinza
  }
};

const DeviceSettings: React.FC<DeviceSettingsProps> = ({
  device,
  open,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const [editedDevice, setEditedDevice] = useState<Device | null>(null);
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });

  useEffect(() => {
    if (device) {
      setEditedDevice({ ...device });
      if (device.color) {
        const hex = device.color.replace('#', '');
        setColor({
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
        });
      } else {
        const defaultColor = getDefaultColor(device.status);
        const hex = defaultColor.replace('#', '');
        setColor({
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
        });
      }
    }
  }, [device]);

  const handleChange = (field: keyof Device, value: any) => {
    if (editedDevice) {
      setEditedDevice({ ...editedDevice, [field]: value });
    }
  };

  const handleColorChange = (channel: 'r' | 'g' | 'b', value: number) => {
    setColor(prev => ({ ...prev, [channel]: value }));
  };

  const handleSave = () => {
    if (editedDevice) {
      const hexColor = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
      onSave({ ...editedDevice, color: hexColor });
      onClose();
    }
  };

  if (!editedDevice) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div">
          Configurações do Dispositivo
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome"
            value={editedDevice.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <TextField
            label="Endereço IP"
            value={editedDevice.ip || ''}
            onChange={(e) => handleChange('ip', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="192.168.1.1"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <TextField
            label="Comunidade SNMP"
            value={editedDevice.snmpCommunity || ''}
            onChange={(e) => handleChange('snmpCommunity', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="public"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <TextField
            label="Rede"
            value={editedDevice.network || ''}
            onChange={(e) => handleChange('network', e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="192.168.1.0/24"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={editedDevice.status || 'online'}
              onChange={(e) => handleChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
              <MenuItem value="warning">Instável</MenuItem>
            </Select>
          </FormControl>
          <Box>
            <Typography gutterBottom>Cor do Dispositivo</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption">R</Typography>
                <Slider
                  value={color.r}
                  onChange={(_, value) => handleColorChange('r', value as number)}
                  min={0}
                  max={255}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption">G</Typography>
                <Slider
                  value={color.g}
                  onChange={(_, value) => handleColorChange('g', value as number)}
                  min={0}
                  max={255}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption">B</Typography>
                <Slider
                  value={color.b}
                  onChange={(_, value) => handleColorChange('b', value as number)}
                  min={0}
                  max={255}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceSettings; 
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Device } from '../types/device';

interface InfoWindowProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  device: Device | null;
}

const InfoWindow: React.FC<InfoWindowProps> = ({
  open,
  onClose,
  title,
  content,
  device,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          {title}
        </Typography>
        {device && (
          <Typography variant="subtitle2" color="text.secondary">
            Dispositivo: {device.name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 1,
            p: 2,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          {content}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoWindow; 
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper } from '@mui/material';
import L from 'leaflet';

// Corrigir ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Device {
    id: number;
    name: string;
    ip_address: string;
    status: string;
    latitude: number;
    longitude: number;
    device_type: string;
}

const NetworkMap: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [center, setCenter] = useState<[number, number]>([-15.7801, -47.9292]); // Brasília como centro padrão

    useEffect(() => {
        // TODO: Implementar chamada à API para buscar dispositivos
        const fetchDevices = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/devices');
                const data = await response.json();
                setDevices(data);
                
                // Se houver dispositivos, centralizar no primeiro
                if (data.length > 0) {
                    setCenter([data[0].latitude, data[0].longitude]);
                }
            } catch (error) {
                console.error('Erro ao buscar dispositivos:', error);
            }
        };

        fetchDevices();
        const interval = setInterval(fetchDevices, 30000); // Atualizar a cada 30 segundos

        return () => clearInterval(interval);
    }, []);

    const getMarkerColor = (status: string) => {
        switch (status) {
            case 'online':
                return '#4CAF50';
            case 'offline':
                return '#F44336';
            case 'warning':
                return '#FFC107';
            default:
                return '#9E9E9E';
        }
    };

    return (
        <Box sx={{ height: '100vh', width: '100%' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {devices.map((device) => (
                    <Marker
                        key={device.id}
                        position={[device.latitude, device.longitude]}
                        icon={L.divIcon({
                            className: 'custom-marker',
                            html: `<div style="
                                background-color: ${getMarkerColor(device.status)};
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                border: 2px solid white;
                                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                            "></div>`,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                        })}
                    >
                        <Popup>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6">{device.name}</Typography>
                                <Typography>IP: {device.ip_address}</Typography>
                                <Typography>Tipo: {device.device_type}</Typography>
                                <Typography>Status: {device.status}</Typography>
                            </Paper>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </Box>
    );
};

export default NetworkMap; 
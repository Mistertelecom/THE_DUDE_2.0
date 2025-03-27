from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Enum
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class DeviceType(str, enum.Enum):
    MIKROTIK = "mikrotik"
    CISCO = "cisco"
    UBIQUITI = "ubiquiti"
    MIMOSA = "mimosa"
    OTHER = "other"

class DeviceStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    WARNING = "warning"
    UNKNOWN = "unknown"

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ip_address = Column(String, unique=True, index=True)
    device_type = Column(Enum(DeviceType))
    status = Column(Enum(DeviceStatus), default=DeviceStatus.UNKNOWN)
    last_seen = Column(DateTime(timezone=True))
    snmp_community = Column(String, nullable=True)
    snmp_version = Column(String, nullable=True)
    snmp_port = Column(Integer, default=161)
    ping_enabled = Column(Boolean, default=True)
    snmp_enabled = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Informações adicionais
    model = Column(String, nullable=True)
    firmware_version = Column(String, nullable=True)
    uptime = Column(Integer, nullable=True)
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    bandwidth_usage = Column(Float, nullable=True) 
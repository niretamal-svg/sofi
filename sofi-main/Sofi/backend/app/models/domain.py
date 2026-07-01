from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from app.models.pyobjectid import PyObjectId

# ============================================================================
# Client Models
# ============================================================================

class PortalConfig(BaseModel):
    portal_id: PyObjectId = Field(description="Referencia al catálogo de portales")
    credentials: str = Field(description="Usuario, pass, tokens del portal (cifrado)")

class ClientSettings(BaseModel):
    timezone: str = "UTC"
    locale: str = "es"

class ClientModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., max_length=120)
    plan: str = Field(default="free", description="free | starter | pro | enterprise")
    config_portales: List[PortalConfig] = Field(default_factory=list)
    settings: ClientSettings = Field(default_factory=ClientSettings)
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

# ============================================================================
# User Models
# ============================================================================

class RefreshToken(BaseModel):
    token_hash: str
    expires_at: datetime

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    client_id: PyObjectId
    email: EmailStr
    name: str = Field(..., max_length=120)
    role: str = Field(default="recruiter", description="admin | recruiter | viewer")
    refresh_tokens: List[RefreshToken] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

# ============================================================================
# Vacancy Models
# ============================================================================

class VacancyContent(BaseModel):
    titulo: str
    descripcion: str
    requisitos: str
    modalidad: str = Field(default="presencial", description="presencial | remoto | híbrido")

class ProfileModel(BaseModel):
    name: str
    ia_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Prompt y parámetros usados por la IA")
    generado_por_ia: bool = False

class PortalStatus(BaseModel):
    name: str = Field(description="Nombre (LinkedIn, Laborum, etc.)")
    result_url: Optional[str] = None
    agent_logs: List[str] = Field(default_factory=list)
    status: str = Field(default="pending", description="pending | published | error")

class CampaignModel(BaseModel):
    status: str = Field(default="active", description="draft | active | completed")
    portals: List[PortalStatus] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VacancyModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    client_id: PyObjectId
    created_by: PyObjectId
    codigo: str
    content: VacancyContent
    status: str = Field(default="draft", description="draft | in_process | ready | published | closed")
    profiles: List[ProfileModel] = Field(default_factory=list)
    campaigns: List[CampaignModel] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

# ============================================================================
# Audit Logs
# ============================================================================

class ActorModel(BaseModel):
    id: Optional[PyObjectId] = None
    type: str = Field(description="user | agent")
    email: Optional[EmailStr] = None

class AuditLogModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    client_id: PyObjectId
    actor: ActorModel
    action: str = Field(..., description="vacante.create, etc.")
    payload: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict, description="IP, User-Agent, etc.")
    result: str = Field(default="success", description="success | error")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

"""
Pydantic models for request/response validation and serialization.
"""

from datetime import datetime
from typing import Optional, List, Any
from enum import Enum

from pydantic import BaseModel, Field, EmailStr


# ============================================================================
# Enums
# ============================================================================


class EstadoVacancia(str, Enum):
    """Job vacancy status."""

    BORRADOR = "borrador"
    VIGENTE = "vigente"
    PAUSADA = "pausada"
    CERRADA = "cerrada"


class EstadoCampania(str, Enum):
    """Campaign status."""

    BORRADOR = "borrador"
    PENDIENTE_PAGO = "pendiente_pago"
    PUBLICANDO = "publicando"
    PUBLICADA = "publicada"
    ERROR = "error"
    CANCELADA = "cancelada"


class EstadoPortalPublicacion(str, Enum):
    """Portal publication status."""

    PENDIENTE = "pendiente"
    PUBLICANDO = "publicando"
    PUBLICADA = "publicada"
    ERROR = "error"
    CANCELADA = "cancelada"


class PlanTier(str, Enum):
    """Client subscription plan tier."""

    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class Rol(str, Enum):
    """User roles."""

    ADMIN = "admin"
    RECLUTADOR = "reclutador"
    VIEWER = "viewer"


class TipoJornada(str, Enum):
    """Job type."""

    TIEMPO_COMPLETO = "tiempo_completo"
    TIEMPO_PARCIAL = "tiempo_parcial"
    FREELANCE = "freelance"
    CONTRATO = "contrato"


class NivelExperiencia(str, Enum):
    """Experience level."""

    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    ANY = "any"


class MetodoPago(str, Enum):
    """Payment method."""

    STRIPE = "stripe"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    TRANSFER = "transfer"


# ============================================================================
# Client Models
# ============================================================================


class ClientCreate(BaseModel):
    """Create client request."""

    nombre: str = Field(..., min_length=1, max_length=255)
    plan_tier: PlanTier = PlanTier.FREE


class ClientResponse(BaseModel):
    """Client response."""

    id: str
    nombre: str
    plan_tier: PlanTier
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Company Models
# ============================================================================


class CompanyCreate(BaseModel):
    """Create company request."""

    nombre: str = Field(..., min_length=1, max_length=255)
    rfc: Optional[str] = Field(None, max_length=20)
    pais: str = Field(..., max_length=100)
    logo_url: Optional[str] = None


class CompanyResponse(BaseModel):
    """Company response."""

    id: str
    client_id: str
    nombre: str
    rfc: Optional[str]
    pais: str
    logo_url: Optional[str]
    activa: bool

    class Config:
        from_attributes = True


# ============================================================================
# Category Models
# ============================================================================


class CategoryCreate(BaseModel):
    """Create category request."""

    nombre: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    icono: Optional[str] = None
    orden: int = 0


class CategoryResponse(BaseModel):
    """Category response."""

    id: str
    client_id: str
    nombre: str
    slug: str
    icono: Optional[str]
    orden: int
    activa: bool

    class Config:
        from_attributes = True


# ============================================================================
# User Models
# ============================================================================


class UserCreate(BaseModel):
    """Create user request."""

    nombre: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    rol: Rol = Rol.VIEWER
    empresa_id: Optional[str] = None


class UserResponse(BaseModel):
    """User response."""

    id: str
    client_id: str
    nombre: str
    email: str
    uid: str  # Firebase UID
    rol: Rol
    empresa_id: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


# ============================================================================
# Vacancy Models
# ============================================================================


class VacancyCreate(BaseModel):
    """Create vacancy request."""

    empresa_id: str
    codigo: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=255)
    categoria_id: str
    descripcion: str
    proposito: Optional[str] = None
    direccion: str
    estado: EstadoVacancia = EstadoVacancia.BORRADOR
    preguntas: Optional[List[str]] = None


class VacancyUpdate(BaseModel):
    """Update vacancy request."""

    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[EstadoVacancia] = None
    direccion: Optional[str] = None
    proposito: Optional[str] = None


class VacancyResponse(BaseModel):
    """Vacancy response."""

    id: str
    client_id: str
    empresa_id: str
    codigo: str
    nombre: str
    categoria_id: str
    descripcion: str
    proposito: Optional[str]
    direccion: str
    estado: EstadoVacancia
    preguntas: Optional[List[str]]
    reclutador_id: Optional[str]
    vigente: bool
    creado_por: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Job Profile Models
# ============================================================================


class JobProfileCreate(BaseModel):
    """Create job profile request."""

    empresa_id: str
    nombre_perfil: str = Field(..., min_length=1, max_length=255)
    categoria_id: str
    descripcion: str
    requisitos: List[str] = Field(default_factory=list)
    beneficios: List[str] = Field(default_factory=list)
    titulo_anuncio: Optional[str] = None
    tipo_jornada: Optional[TipoJornada] = None
    salario_min: Optional[float] = None
    salario_max: Optional[float] = None
    moneda: str = "USD"
    ubicacion: Optional[str] = None


class JobProfileResponse(BaseModel):
    """Job profile response."""

    id: str
    client_id: str
    empresa_id: str
    nombre_perfil: str
    titulo_anuncio: Optional[str]
    categoria_id: str
    tipo_jornada: Optional[TipoJornada]
    salario_min: Optional[float]
    salario_max: Optional[float]
    moneda: str
    ubicacion: Optional[str]
    descripcion: str
    requisitos: List[str]
    beneficios: List[str]
    generado_por_ia: bool
    ia_chips: List[str]
    tono: Optional[str]
    veces_usado: int
    ultimo_uso: Optional[datetime]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AIProfileRequest(BaseModel):
    """AI job profile generation request."""

    job_title: str = Field(..., min_length=1, max_length=255)
    company_name: str = Field(..., min_length=1, max_length=255)
    experience_level: NivelExperiencia = NivelExperiencia.ANY
    job_type: TipoJornada = TipoJornada.TIEMPO_COMPLETO
    tone: str = Field("profesional", max_length=50)
    industry: Optional[str] = None
    additional_context: Optional[str] = None


class AIProfileResponse(BaseModel):
    """AI generated job profile response."""

    titulo_anuncio: str
    descripcion: str
    requisitos: List[str]
    beneficios: List[str]
    tipo_jornada: str
    ia_chips: List[str]
    sugerencias: List[str]


# ============================================================================
# Portal Models
# ============================================================================


class PortalCreate(BaseModel):
    """Create portal request (admin only)."""

    nombre: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    url: str
    paises: List[str] = Field(default_factory=list)
    tipo: str = Field(default="job_board", max_length=50)
    modelo_empresa: str = Field(default="freemium", max_length=50)
    costo_base: float = 0.0
    moneda: str = "USD"
    logo_url: Optional[str] = None
    requires_login: bool = True
    notas: Optional[str] = None


class PortalCredentialsUpdate(BaseModel):
    """Update portal credentials."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class PortalResponse(BaseModel):
    """Portal response."""

    id: str
    client_id: str
    nombre: str
    slug: str
    url: str
    paises: List[str]
    tipo: str
    modelo_empresa: str
    costo_base: float
    moneda: str
    logo_url: Optional[str]
    requires_login: bool
    notas: Optional[str]
    activo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Campaign Models
# ============================================================================


class PortalPublicationStatus(BaseModel):
    """Portal publication status within a campaign."""

    portal_id: str
    nombre_portal: str
    estado: EstadoPortalPublicacion
    costo_estimado: float
    url_publicacion: Optional[str] = None
    id_externo: Optional[str] = None
    intentos: int = 0
    ultimo_intento: Optional[datetime] = None
    error_msg: Optional[str] = None
    publicado_en: Optional[datetime] = None


class CampaignCreate(BaseModel):
    """Create campaign request."""

    vacante_id: str
    perfil_id: Optional[str] = None
    empresa_id: str
    portales: List[str] = Field(..., min_items=1)  # Portal IDs
    paises_activos: List[str] = Field(default_factory=list)
    fecha_inicio: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None


class CampaignResponse(BaseModel):
    """Campaign response."""

    id: str
    client_id: str
    vacante_id: str
    perfil_id: Optional[str]
    empresa_id: str
    reclutador_id: Optional[str]
    paises_activos: List[str]
    portales: List[PortalPublicationStatus]
    estado: EstadoCampania
    costo_total: float
    moneda: str
    fecha_inicio: Optional[datetime]
    fecha_expiracion: Optional[datetime]
    pago_id: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CampaignUpdate(BaseModel):
    """Update campaign request."""

    estado: Optional[EstadoCampania] = None
    fecha_expiracion: Optional[datetime] = None


# ============================================================================
# Payment Models
# ============================================================================


class PaymentCreate(BaseModel):
    """Create payment request."""

    campana_id: str
    empresa_id: str
    monto: float = Field(..., gt=0)
    moneda: str = "USD"
    metodo: MetodoPago = MetodoPago.STRIPE
    desglose: Optional[dict[str, float]] = None


class PaymentResponse(BaseModel):
    """Payment response."""

    id: str
    client_id: str
    campana_id: str
    empresa_id: str
    monto: float
    moneda: str
    metodo: MetodoPago
    estado: str
    stripe_payment_intent_id: Optional[str]
    desglose: Optional[dict[str, float]]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Generic Response Models
# ============================================================================


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""

    data: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: datetime
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    timestamp: datetime

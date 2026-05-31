"""
Google Gemini AI service for generating job profiles and descriptions.
Uses Gemini 1.5 Pro model for structured JSON output generation.
"""

import json
import logging
from typing import Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for AI-powered job profile generation."""

    def __init__(self, api_key: str):
        """
        Initialize Gemini service.

        Args:
            api_key: Google Generative AI API key
        """
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-pro")

    async def generate_job_profile(
        self,
        job_title: str,
        company_name: str,
        experience_level: str,
        job_type: str,
        tone: str = "profesional",
        industry: Optional[str] = None,
        additional_context: Optional[str] = None,
    ) -> dict:
        """
        Generate a comprehensive job profile using Gemini AI.

        Args:
            job_title: Job title/position name
            company_name: Company name
            experience_level: Experience required (junior|mid|senior|any)
            job_type: Job type (tiempo_completo|tiempo_parcial|freelance|contrato)
            tone: Tone for job description (profesional|amigable|formal|casual)
            industry: Industry/sector (optional)
            additional_context: Additional context for generation (optional)

        Returns:
            Dictionary containing:
                - titulo_anuncio: Generated job announcement title
                - descripcion: Detailed job description
                - requisitos: List of required skills/qualifications
                - beneficios: List of benefits
                - tipo_jornada: Work arrangement type
                - ia_chips: List of improvement suggestions
                - sugerencias: Additional suggestions for HR
        """
        import asyncio
        logger.info(f"Mocking AI generation for {job_title} at {company_name}")
        await asyncio.sleep(2.5)
        
        return {
            "titulo_anuncio": f"Excelente oportunidad: {job_title} en {company_name}",
            "descripcion": f"En {company_name} estamos en búsqueda de un {job_title} apasionado y proactivo para unirse a nuestro equipo. Buscamos talento con perfil {experience_level} para trabajar en la modalidad de {job_type.replace('_', ' ')}. Trabajaras en proyectos desafiantes en el sector de {industry or 'tecnologia'}. Valoramos la innovación, el trabajo en equipo y el compromiso con la excelencia. Esta es una excelente oportunidad para desarrollar tu carrera profesional en un entorno dinámico, utilizando un enfoque {tone}.",
            "requisitos": [
                f"Experiencia comprobable en roles de {job_title} (nivel {experience_level})",
                "Conocimientos sólidos de las herramientas requeridas",
                "Excelentes habilidades de comunicación y trabajo en equipo",
                "Capacidad para resolver problemas de manera creativa",
                "Disposición para aprender y adaptarse rápidamente"
            ],
            "beneficios": [
                "Salario altamente competitivo en el mercado",
                f"Modalidad de trabajo: {job_type.replace('_', ' ')}",
                "Seguro médico y beneficios de bienestar",
                "Oportunidades constantes de capacitación y desarrollo profesional"
            ],
            "tipo_jornada": job_type,
            "ia_chips": [
                "Destaca el ambiente de trabajo colaborativo",
                "Menciona metodologías específicas para atraer al perfil adecuado",
                "Enfatiza la cultura y valores de la empresa"
            ],
            "sugerencias": [
                "Agrega una prueba práctica breve durante la entrevista.",
                "Mantén un proceso de selección ágil y transparente."
            ]
        }

    def _build_prompt(
        self,
        job_title: str,
        company_name: str,
        experience_level: str,
        job_type: str,
        tone: str,
        industry: Optional[str],
        additional_context: Optional[str],
    ) -> str:
        """Build the prompt for Gemini."""
        base_prompt = f"""Eres un experto en recursos humanos de Latinoamérica con experiencia en publicar ofertas de trabajo atractivas.

Genera una oferta de trabajo profesional y atractiva en español (para Latinoamérica) para la siguiente posición:

Título del puesto: {job_title}
Empresa: {company_name}
Nivel de experiencia requerido: {experience_level}
Tipo de jornada: {job_type}
Tono del anuncio: {tone}
{"Industria/Sector: " + industry if industry else ""}
{"Contexto adicional: " + additional_context if additional_context else ""}

Genera una respuesta en formato JSON VÁLIDO con la siguiente estructura exacta (sin caracteres de escape innecesarios):
{{
  "titulo_anuncio": "Un título atractivo y profesional para la oferta (máximo 100 caracteres)",
  "descripcion": "Una descripción detallada, motivadora y profesional de la posición y responsabilidades principales (400-600 palabras)",
  "requisitos": ["Requisito 1", "Requisito 2", "Requisito 3", "Requisito 4", "Requisito 5"],
  "beneficios": ["Beneficio 1", "Beneficio 2", "Beneficio 3", "Beneficio 4"],
  "tipo_jornada": "{job_type}",
  "ia_chips": ["Sugerencia de mejora 1", "Sugerencia de mejora 2", "Sugerencia de mejora 3"],
  "sugerencias": ["Sugerencia general para RRHH 1", "Sugerencia general para RRHH 2"]
}}

IMPORTANTE:
- La respuesta DEBE ser un JSON válido que pueda parsearse.
- Todos los valores de strings deben estar escapados correctamente.
- Usa comillas dobles para los valores de string.
- Evita saltos de línea dentro de los strings; reemplázalos con espacios o usa \\n si es necesario.
- No incluyas texto antes o después del JSON.
"""
        return base_prompt

    def _get_default_profile(self, job_title: str, experience_level: str) -> dict:
        """Get default profile when generation fails."""
        level_map = {
            "junior": "Recién graduado o con 1-2 años de experiencia",
            "mid": "3-5 años de experiencia profesional",
            "senior": "5+ años de experiencia especializada",
            "any": "Cualquier nivel de experiencia",
        }

        return {
            "titulo_anuncio": f"{job_title} - Únete a nuestro equipo",
            "descripcion": f"Estamos buscando un profesional con experiencia en {job_title}. "
            f"Nivel requerido: {level_map.get(experience_level, experience_level)}. "
            f"Esta es una excelente oportunidad para desarrollar tu carrera profesional.",
            "requisitos": [
                f"Experiencia en {job_title}",
                "Conocimientos técnicos relevantes",
                "Excelentes habilidades de comunicación",
                "Capacidad para trabajar en equipo",
                "Disponibilidad inmediata",
            ],
            "beneficios": [
                "Salario competitivo",
                "Ambiente de trabajo colaborativo",
                "Oportunidades de crecimiento profesional",
                "Beneficios adicionales",
            ],
            "tipo_jornada": "tiempo_completo",
            "ia_chips": [
                "Considera agregar información sobre el equipo",
                "Detalla las responsabilidades clave",
                "Menciona las oportunidades de crecimiento",
            ],
            "sugerencias": [
                "Revisa y personaliza la descripción con detalles específicos",
                "Considera agregar preguntas adicionales en el proceso de selección",
            ],
        }


# Global Gemini service instance
_gemini_service: GeminiService = None


def init_gemini(api_key: str) -> GeminiService:
    """Initialize global Gemini service."""
    global _gemini_service
    _gemini_service = GeminiService(api_key)
    return _gemini_service


def get_gemini_service() -> GeminiService:
    """Get global Gemini service instance."""
    if _gemini_service is None:
        raise RuntimeError("Gemini service not initialized")
    return _gemini_service

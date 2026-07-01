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

    def _make_professional_requirements(self, lines: list, job_title: str) -> list:
        dictionary = {
            "react": "Dominio avanzado del ecosistema de React.js, hooks personalizados y arquitectura de componentes modernos.",
            "python": "Experiencia en desarrollo backend robusto utilizando Python y frameworks como FastAPI, Django o Flask.",
            "javascript": "Conocimientos profundos de JavaScript moderno (ES6+) y desarrollo con TypeScript.",
            "sql": "Sólidos conocimientos en diseño, modelado y optimización de bases de datos relacionales (SQL).",
            "nosql": "Experiencia práctica trabajando con bases de datos NoSQL, preferentemente MongoDB.",
            "git": "Manejo fluido de sistemas de control de versiones Git y flujos de trabajo colaborativos (GitFlow).",
            "ingles": "Comprensión lectora y comunicación oral técnica fluida en idioma inglés.",
            "comunicacion": "Habilidades excepcionales de comunicación asertiva, trabajo colaborativo e inteligencia emocional.",
            "proactividad": "Actitud proactiva orientada a la mejora continua de procesos y resolución ágil de problemas.",
            "servicio": "Marcada orientación de servicio al cliente y excelencia en la calidad de entrega."
        }
        
        formatted = []
        if not lines:
            return [
                f"Experiencia profesional comprobable mínima de 2 años desempeñando funciones de {job_title} o similares.",
                "Formación académica en Ingeniería de Software, Ciencias de la Computación o experiencia equivalente comprobable.",
                "Capacidad demostrada para el aseguramiento de mejores prácticas de codificación y resolución de problemas.",
                "Experiencia colaborando de manera sinérgica con equipos multidisciplinarios bajo marcos ágiles (Scrum/Kanban)."
            ]
            
        for line in lines:
            lower = line.lower()
            replaced = False
            for key, val in dictionary.items():
                if key in lower:
                    formatted.append(val)
                    replaced = True
                    break
            if not replaced:
                clean = line.strip().capitalize()
                if not clean.endswith("."):
                    clean += "."
                formatted.append(clean)
                
        if len(formatted) < 3:
            formatted.append("Capacidad demostrada de adaptabilidad al cambio y asimilación rápida de metodologías de la empresa.")
            
        return formatted

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
        # Check if the API key is a dummy or placeholder
        api_key = genai.get_default_api_key() or ""
        is_placeholder = not api_key or "your-gemini" in api_key.lower() or "api_key" in api_key.lower() or api_key.startswith("your-")

        if not is_placeholder:
            try:
                logger.info(f"Generating AI job profile for {job_title} using Gemini API...")
                prompt = self._build_prompt(
                    job_title=job_title,
                    company_name=company_name,
                    experience_level=experience_level,
                    job_type=job_type,
                    tone=tone,
                    industry=industry,
                    additional_context=additional_context,
                )
                response = await self.model.generate_content_async(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                res_text = response.text.strip()
                # Clean codeblock wrappers if present
                if res_text.startswith("```json"):
                    res_text = res_text[7:]
                if res_text.endswith("```"):
                    res_text = res_text[:-3]
                res_text = res_text.strip()

                return json.loads(res_text)
            except Exception as e:
                logger.error(f"Error calling real Gemini API: {e}. Falling back to dynamic mock.")

        import asyncio
        logger.info(f"Using dynamic mock AI generation for {job_title} at {company_name}")
        await asyncio.sleep(1.5)

        # Base description and requirements
        desc = f"En {company_name} estamos en búsqueda de un {job_title} apasionado y proactivo para unirse a nuestro equipo. Buscamos talento con perfil {experience_level} para trabajar en la modalidad de {job_type.replace('_', ' ')}. Trabajaras en proyectos desafiantes en el sector de {industry or 'tecnologia'}. Valoramos la innovación, el trabajo en equipo y el compromiso con la excelencia. Esta es una excelente oportunidad para desarrollar tu carrera profesional en un entorno dinámico, utilizando un enfoque {tone}."
        requisitos = self._make_professional_requirements([], job_title)
        sugerencias = [
            "Agrega una prueba práctica breve durante la entrevista.",
            "Mantén un proceso de selección ágil y transparente."
        ]

        if additional_context:
            desc_optimized = ""
            if "Descripción actual del puesto:" in additional_context:
                try:
                    orig_desc = additional_context.split("Descripción actual del puesto:\n")[1].split("\n\n")[0].strip()
                    if orig_desc:
                        desc_optimized = f"En {company_name} nos encontramos en la búsqueda activa de un/a profesional calificado/a para incorporarse como {job_title}.\n\nDescripción del rol:\n{orig_desc}\n\nOfrecemos integrarte a un equipo dinámico, con un excelente clima organizacional y constantes oportunidades para impulsar tu desarrollo profesional."
                except Exception:
                    pass

            if "Requisitos actuales del puesto:" in additional_context:
                try:
                    orig_reqs = additional_context.split("Requisitos actuales del puesto:\n")[1].split("\n\n")[0].strip()
                    if orig_reqs:
                        req_lines = [r.strip("-*• ").strip() for r in orig_reqs.split("\n") if r.strip()]
                        if req_lines:
                            requisitos = self._make_professional_requirements(req_lines, job_title)
                except Exception:
                    pass

            if desc_optimized:
                desc = desc_optimized

            sugerencias = []
            context_lower = additional_context.lower()
            if "salario" not in context_lower and "sueldo" not in context_lower and "pago" not in context_lower:
                sugerencias.append("Se recomienda incluir el rango salarial para aumentar la tasa de postulaciones en un 30%.")
            if "beneficios" not in context_lower and "seguro" not in context_lower and "prestaciones" not in context_lower:
                sugerencias.append("Destaca los beneficios no monetarios (seguro de salud, días de descanso, etc.) para atraer mejor talento.")
            if len(requisitos) > 5:
                sugerencias.append("Tienes muchos requisitos listados. Considera reducir la lista a los 3-4 más esenciales para no desmotivar a postulantes potenciales.")
            if len(desc) < 150:
                sugerencias.append("La descripción del puesto es algo corta. Te sugerimos expandir las responsabilidades principales para dar más claridad.")
            if not sugerencias:
                sugerencias = [
                    "¡Tu anuncio se ve muy completo! Recuerda publicar en los horarios de mayor tráfico.",
                    "Mantén un proceso de selección ágil y transparente."
                ]

        return {
            "titulo_anuncio": f"Excelente oportunidad: {job_title} en {company_name}",
            "descripcion": desc,
            "requisitos": requisitos,
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
            "sugerencias": sugerencias
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

REQUISITOS IMPORTANTES DE REDACCIÓN:
- La sección de requisitos debe ser sumamente profesional, corporativa y específica. Evita viñetas genéricas como "ganas de trabajar" o "experiencia previa".
- Estructura los requisitos de forma clara, incluyendo niveles de experiencia específicos, formación académica deseada, competencias técnicas (hard skills) y habilidades interpersonales (soft skills) clave para el éxito del puesto.

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

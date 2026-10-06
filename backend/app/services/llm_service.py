import os
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.logging_config import logger
from app.schemas.analysis import IndicatorItem

class LLMService:
    """
    Modular LLM service for explainable security reasoning.
    Supports Google Gemini, OpenAI, Groq, and safe rule-based reasoning fallback.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        self.model = settings.LLM_MODEL

    def is_configured(self) -> bool:
        if self.provider == "gemini" and self.gemini_key:
            return True
        if self.provider == "openai" and self.openai_key:
            return True
        if self.provider == "groq" and self.groq_key:
            return True
        return False

    async def generate_explanation(
        self,
        subject: str,
        sender_email: str,
        classification: str,
        risk_score: float,
        indicators: List[IndicatorItem],
        prompt_injection: bool = False
    ) -> Dict[str, str]:
        """
        Generates explainable natural-language reasoning and recommended action.
        If LLM API is not configured, provides deterministic explainability.
        """
        if not self.is_configured():
            return self._generate_rule_based_explanation(
                subject, sender_email, classification, risk_score, indicators, prompt_injection
            )

        try:
            if self.provider == "gemini":
                return await self._call_gemini(subject, sender_email, classification, risk_score, indicators, prompt_injection)
            elif self.provider == "openai":
                return await self._call_openai(subject, sender_email, classification, risk_score, indicators, prompt_injection)
            elif self.provider == "groq":
                return await self._call_groq(subject, sender_email, classification, risk_score, indicators, prompt_injection)
        except Exception as e:
            logger.warning(f"LLM API call failed ({self.provider}): {e}; using rule-based reasoning.")
            return self._generate_rule_based_explanation(
                subject, sender_email, classification, risk_score, indicators, prompt_injection, note=f"LLM call failed: {e}"
            )

        return self._generate_rule_based_explanation(
            subject, sender_email, classification, risk_score, indicators, prompt_injection
        )

    async def _call_gemini(self, subject: str, sender_email: str, classification: str, risk_score: float, indicators: List[IndicatorItem], prompt_injection: bool) -> Dict[str, str]:
        import httpx
        indicator_bullets = "\n".join([f"- {ind.title}: {ind.description}" for ind in indicators])
        prompt = (
            f"You are a Senior SOC Cybersecurity Analyst. Analyze the following email findings and provide an explanation and recommended action.\n"
            f"Sender: {sender_email}\nSubject: {subject}\nClassification: {classification}\nRisk Score: {risk_score}/100\n"
            f"Adversarial Prompt Injection: {'YES' if prompt_injection else 'NO'}\n"
            f"Detected Indicators:\n{indicator_bullets}\n\n"
            f"Respond in 2 distinct sections:\n"
            f"EXPLANATION: (2-3 concise sentences explaining why this email was classified as {classification})\n"
            f"ACTION: (1 actionable operational instruction for the recipient/SOC team)"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return self._parse_llm_output(text, classification)
            else:
                raise Exception(f"Gemini API returned HTTP {res.status_code}: {res.text}")

    async def _call_openai(self, subject, sender_email, classification, risk_score, indicators, prompt_injection) -> Dict[str, str]:
        import httpx
        indicator_bullets = "\n".join([f"- {ind.title}: {ind.description}" for ind in indicators])
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a cybersecurity email analysis expert."},
                {"role": "user", "content": f"Classification: {classification}\nRisk: {risk_score}/100\nIndicators:\n{indicator_bullets}\nProvide EXPLANATION and ACTION."}
            ],
            "temperature": 0.2
        }
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"]
                return self._parse_llm_output(text, classification)
            raise Exception(f"OpenAI error: HTTP {res.status_code}")

    async def _call_groq(self, subject, sender_email, classification, risk_score, indicators, prompt_injection) -> Dict[str, str]:
        import httpx
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a cybersecurity email analysis expert."},
                {"role": "user", "content": f"Classification: {classification}\nRisk: {risk_score}/100\nProvide EXPLANATION and ACTION."}
            ],
            "temperature": 0.2
        }
        headers = {"Authorization": f"Bearer {self.groq_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                text = res.json()["choices"][0]["message"]["content"]
                return self._parse_llm_output(text, classification)
            raise Exception(f"Groq error: HTTP {res.status_code}")

    def _parse_llm_output(self, text: str, default_class: str) -> Dict[str, str]:
        lines = text.strip().split("\n")
        explanation = ""
        action = ""
        current_mode = "exp"
        for line in lines:
            if "EXPLANATION:" in line.upper():
                current_mode = "exp"
                explanation += line.split(":", 1)[-1].strip() + " "
            elif "ACTION:" in line.upper():
                current_mode = "act"
                action += line.split(":", 1)[-1].strip() + " "
            else:
                if current_mode == "exp":
                    explanation += line.strip() + " "
                else:
                    action += line.strip() + " "

        return {
            "explanation": explanation.strip() or text.strip(),
            "recommended_action": action.strip() or "Do not click links or provide credentials. Report this email."
        }

    def _generate_rule_based_explanation(
        self,
        subject: str,
        sender_email: str,
        classification: str,
        risk_score: float,
        indicators: List[IndicatorItem],
        prompt_injection: bool,
        note: str = ""
    ) -> Dict[str, str]:
        """Explainable reasoning based directly on matched indicators."""
        if prompt_injection:
            exp = (
                "CRITICAL SECURITY ANOMALY: This email was flagged because it contains adversarial instruction "
                "injection patterns targeting the AI analysis system. The email content has been isolated as untrusted data."
            )
            act = "Quarantine message immediately. Disregard any embedded instructions. Block sending address."
        elif classification == "Phishing":
            reasons = [ind.title for ind in indicators[:3]]
            exp = (
                f"This email is classified as Phishing (Risk Score {risk_score}/100) because verified indicators "
                f"demonstrate credential theft or deception: {', '.join(reasons) if reasons else 'suspicious authentication patterns'}."
            )
            act = "Do not click links or provide credentials. Report this email to your organization's security team."
        elif classification == "Suspicious":
            exp = (
                f"This email contains moderate risk indicators (Risk Score {risk_score}/100) requiring review. "
                f"Domain reputation or urgency patterns deviate from established baseline communications."
            )
            act = "Verify the sender through an official out-of-band channel before taking any requested actions."
        elif classification == "Spam":
            exp = "This message contains unsolicited commercial patterns or bulk marketing keywords."
            act = "Safe to delete or move to Junk/Spam folder. Unsubscribe if unsolicited."
        else:
            exp = "No malicious indicators, credential harvesting patterns, or domain spoofing signals were detected."
            act = "Safe to proceed with normal operational handling."

        return {
            "explanation": exp,
            "recommended_action": act
        }

llm_service = LLMService()

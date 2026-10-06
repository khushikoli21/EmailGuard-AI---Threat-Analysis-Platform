from typing import List, Dict, Any
from app.rag.vector_store import vector_store
from app.schemas.analysis import EvidenceDetailItem, IndicatorItem

class RAGEvidenceAgent:
    """Retrieves relevant threat intelligence and attack taxonomy evidence via RAG."""

    def retrieve_evidence(self, subject: str, indicators: List[IndicatorItem], urls: List[str]) -> List[EvidenceDetailItem]:
        # Formulate contextual search query
        indicator_terms = [ind.title for ind in indicators]
        query = f"{subject} {' '.join(indicator_terms)} {' '.join(urls)}"

        matches = vector_store.query(query_text=query, top_k=3, min_similarity=0.20)
        evidence_items: List[EvidenceDetailItem] = []

        for m in matches:
            status = "Malicious" if m["category"] in ["Phishing", "Business Email Compromise"] else "Suspicious"
            evidence_items.append(
                EvidenceDetailItem(
                    source="RAG / Knowledge Base",
                    finding=f"Correlates with: {m['title']} ({m['category']}).",
                    status=status,
                    reference=f"{m['source']} (Relevance: {m['similarity']})",
                    relevance_score=m["similarity"]
                )
            )

        return evidence_items

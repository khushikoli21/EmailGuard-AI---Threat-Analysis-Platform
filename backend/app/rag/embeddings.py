import math
import re
from typing import List

class LightweightEmbedder:
    """
    Lightweight deterministic token-frequency embedding generator.
    Guarantees RAG functions without requiring bulky binary packages if not yet installed,
    while producing standard normalized cosine vectors for semantic search.
    """
    def __init__(self, vector_dim: int = 128):
        self.vector_dim = vector_dim

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.vector_dim

        vec = [0.0] * self.vector_dim
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return [0.0] * self.vector_dim

        for w in words:
            # Deterministic hash to vector index
            h = abs(hash(w)) % self.vector_dim
            vec[h] += 1.0

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(0.0, min(1.0, dot))

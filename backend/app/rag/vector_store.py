import os
import json
from typing import List, Dict, Any, Optional
from app.rag.embeddings import LightweightEmbedder, cosine_similarity
from app.core.config import settings
from app.core.logging_config import logger

class VectorStore:
    """
    Modular Vector Store supporting ChromaDB with transparent fallback
    to local vector registry.
    """
    def __init__(self, persist_dir: str = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIRECTORY
        self.embedder = LightweightEmbedder()
        self._documents: List[Dict[str, Any]] = []
        self._chroma_client = None
        self._chroma_collection = None
        self._init_chroma_if_available()

    def _init_chroma_if_available(self):
        try:
            import chromadb
            os.makedirs(self.persist_dir, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=self.persist_dir)
            self._chroma_collection = self._chroma_client.get_or_create_collection(name="threat_knowledge")
            logger.info("ChromaDB vector store initialized successfully.")
        except ImportError:
            logger.info("ChromaDB package not installed; utilizing standard vector store interface.")
        except Exception as e:
            logger.warning(f"ChromaDB initialization failed: {e}; falling back to standard vector store.")

    def add_document(self, doc_id: str, title: str, category: str, content: str, source: str = "", source_url: str = ""):
        vector = self.embedder.embed_text(f"{title} {category} {content}")
        doc = {
            "id": doc_id,
            "title": title,
            "category": category,
            "content": content,
            "source": source,
            "source_url": source_url,
            "vector": vector
        }
        # Update or append in local list
        existing = next((d for d in self._documents if d["id"] == doc_id), None)
        if existing:
            self._documents.remove(existing)
        self._documents.append(doc)

        # Also store in Chroma if active
        if self._chroma_collection:
            try:
                self._chroma_collection.upsert(
                    ids=[doc_id],
                    documents=[content],
                    metadatas=[{"title": title, "category": category, "source": source, "source_url": source_url}]
                )
            except Exception as e:
                logger.warning(f"Chroma document insertion failed: {e}")

    def query(self, query_text: str, top_k: int = 3, min_similarity: float = 0.25) -> List[Dict[str, Any]]:
        if not self._documents or not query_text:
            return []

        q_vec = self.embedder.embed_text(query_text)
        scored = []

        for d in self._documents:
            sim = cosine_similarity(q_vec, d["vector"])
            if sim >= min_similarity:
                scored.append({
                    "id": d["id"],
                    "title": d["title"],
                    "category": d["category"],
                    "content": d["content"],
                    "source": d["source"],
                    "source_url": d["source_url"],
                    "similarity": round(sim, 3)
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

    def count(self) -> int:
        return len(self._documents)

# Global singleton instance
vector_store = VectorStore()

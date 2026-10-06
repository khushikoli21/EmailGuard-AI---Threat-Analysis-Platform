import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas.evidence import EvidenceCreateRequest, EvidenceItemResponse
from app.rag.vector_store import vector_store

router = APIRouter(prefix="/api", tags=["Evidence & Knowledge Base"])

@router.get(
    "/evidence",
    response_model=List[EvidenceItemResponse],
    summary="List knowledge base articles or search vector documents"
)
def get_evidence_endpoint(
    category: Optional[str] = Query(None, description="Category filter"),
    query: Optional[str] = Query(None, description="Semantic or keyword search query"),
    db: Session = Depends(get_db)
):
    db_query = db.query(models.RAGDocument)

    if category and category.lower() != "all":
        db_query = db_query.filter(models.RAGDocument.category.ilike(category.strip()))

    if query and query.strip():
        q_str = f"%{query.strip()}%"
        db_query = db_query.filter(
            models.RAGDocument.title.ilike(q_str) | models.RAGDocument.content.ilike(q_str)
        )

    docs = db_query.order_by(models.RAGDocument.created_at.desc()).all()

    return [
        EvidenceItemResponse(
            id=d.id,
            title=d.title,
            category=d.category,
            content=d.content,
            summary=d.content[:200] + "..." if len(d.content) > 200 else d.content,
            source=d.source,
            source_url=d.source_url,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in docs
    ]

@router.post(
    "/evidence",
    response_model=EvidenceItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new cybersecurity knowledge document to the RAG vector store"
)
def create_evidence_endpoint(
    payload: EvidenceCreateRequest,
    db: Session = Depends(get_db)
):
    doc_id = str(uuid.uuid4())
    db_doc = models.RAGDocument(
        id=doc_id,
        title=payload.title,
        category=payload.category,
        content=payload.content,
        source=payload.source,
        source_url=payload.source_url
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Also sync into active vector store
    vector_store.add_document(
        doc_id=doc_id,
        title=payload.title,
        category=payload.category,
        content=payload.content,
        source=payload.source,
        source_url=payload.source_url or ""
    )

    return EvidenceItemResponse(
        id=db_doc.id,
        title=db_doc.title,
        category=db_doc.category,
        content=db_doc.content,
        summary=db_doc.content[:200] + "...",
        source=db_doc.source,
        source_url=db_doc.source_url,
        created_at=db_doc.created_at,
        updated_at=db_doc.updated_at
    )

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
    gmail_connections = relationship("GmailConnection", back_populates="user", cascade="all, delete-orphan")

class Email(Base):
    __tablename__ = "emails"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    sender_name = Column(String(255), nullable=True)
    sender_email = Column(String(255), index=True, nullable=False)
    sender_domain = Column(String(255), index=True, nullable=True)
    recipient_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String(50), default="manual", index=True)  # 'manual', 'gmail', 'dataset'
    message_id = Column(String(255), nullable=True, index=True)
    has_urls = Column(Boolean, default=False)
    has_attachments = Column(Boolean, default=False)
    attachment_info = Column(JSON, default=list)  # list of attachment dictionaries
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="emails")
    urls = relationship("EmailURL", back_populates="email", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="email", cascade="all, delete-orphan")

class EmailURL(Base):
    __tablename__ = "email_urls"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email_id = Column(String(36), ForeignKey("emails.id"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    domain = Column(String(255), index=True, nullable=True)
    normalized_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    email = relationship("Email", back_populates="urls")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email_id = Column(String(36), ForeignKey("emails.id"), nullable=False, index=True)
    classification = Column(String(50), nullable=True, index=True)  # 'Safe', 'Suspicious', 'Phishing', etc.
    risk_score = Column(Float, nullable=True, index=True)  # 0.0 - 100.0 or None
    confidence = Column(Float, nullable=True)  # 0.0 - 1.0 or None
    explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    prompt_injection_suspected = Column(Boolean, default=False, index=True)
    analysis_status = Column(String(50), default="completed", index=True)  # 'pending', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    email = relationship("Email", back_populates="analyses")
    indicators = relationship("Indicator", back_populates="analysis", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="analysis", cascade="all, delete-orphan")
    threat_intel_results = relationship("ThreatIntelligenceResult", back_populates="analysis", cascade="all, delete-orphan")
    pipeline_logs = relationship("AnalysisPipelineLog", back_populates="analysis", cascade="all, delete-orphan")

class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    indicator_type = Column(String(80), nullable=False, index=True)  # e.g. 'suspicious_url', 'urgency_language'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False)  # 'Low', 'Medium', 'High', 'Critical'
    evidence = Column(Text, nullable=True)
    source = Column(String(100), default="heuristic")

    analysis = relationship("Analysis", back_populates="indicators")

class ThreatIntelligenceResult(Base):
    __tablename__ = "threat_intelligence_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    url = Column(Text, nullable=False)
    provider = Column(String(80), nullable=False)  # 'VirusTotal', 'urlscan'
    status = Column(String(50), nullable=False)  # 'completed', 'not_configured', 'unavailable', 'failed'
    malicious = Column(Boolean, default=False)
    suspicious = Column(Boolean, default=False)
    reputation = Column(String(50), nullable=True)
    raw_result = Column(JSON, default=dict)
    checked_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="threat_intel_results")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    evidence_type = Column(String(80), nullable=False)  # 'email_content', 'threat_intelligence', 'rag_knowledge'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source = Column(String(120), nullable=False)
    source_url = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="evidence_items")

class RAGDocument(Base):
    __tablename__ = "rag_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)  # 'phishing', 'bec', 'social_engineering', etc.
    content = Column(Text, nullable=False)
    source = Column(String(120), nullable=False)
    source_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AnalysisPipelineLog(Base):
    __tablename__ = "analysis_pipeline_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    component = Column(String(80), nullable=False)  # 'email_analysis', 'threat_intelligence', 'rag', 'risk_engine', 'report_generation'
    status = Column(String(50), nullable=False)  # 'completed', 'skipped', 'failed'
    input_summary = Column(Text, nullable=True)
    output_summary = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True)  # in milliseconds
    created_at = Column(DateTime, default=datetime.utcnow)

    analysis = relationship("Analysis", back_populates="pipeline_logs")

class GmailConnection(Base):
    __tablename__ = "gmail_connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    email_address = Column(String(255), nullable=False)
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="gmail_connections")

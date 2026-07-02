-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create kb_chunks table
CREATE TABLE IF NOT EXISTS kb_chunks (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    doc_id TEXT NOT NULL,
    content TEXT NOT NULL,
    source_ref TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on project_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_kb_chunks_project_id ON kb_chunks (project_id);

-- HNSW index on embedding for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON kb_chunks USING hnsw (embedding vector_cosine_ops);

-- Create the match function for retrieval
CREATE OR REPLACE FUNCTION match_kb_chunks(
    query_embedding vector(768),
    match_project_id TEXT,
    match_count INT DEFAULT 5
)
RETURNS TABLE (id BIGINT, content TEXT, source_ref TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
    SELECT kb_chunks.id, kb_chunks.content, kb_chunks.source_ref,
           1 - (kb_chunks.embedding <=> query_embedding) AS similarity
    FROM kb_chunks
    WHERE kb_chunks.project_id = match_project_id
    ORDER BY kb_chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;

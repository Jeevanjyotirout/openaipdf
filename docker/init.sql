-- OpenAIPDF — PostgreSQL Database Initialization
-- This script runs once when the Docker container first starts.
-- Prisma migrations handle the actual schema.

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- full text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN index support

-- Set default timezone
SET timezone = 'UTC';

-- Grant privileges (in case user was just created)
GRANT ALL PRIVILEGES ON DATABASE openaipdf TO openaipdf;

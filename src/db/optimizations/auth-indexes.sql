-- Phoenix Authentication Database Optimizations
-- High-performance indexes for authentication and user management

-- =======================
-- USER TABLE OPTIMIZATIONS
-- =======================

-- Primary authentication lookup index (most critical)
-- Covers: Stack Auth ID lookups for session validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_clerk_id_active 
ON users (clerk_id) 
WHERE deleted_at IS NULL;

-- Email-based authentication index
-- Covers: Email login and user verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users (email) 
WHERE deleted_at IS NULL;

-- User session activity index
-- Covers: Last active tracking and session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active 
ON users (last_active_at DESC) 
WHERE deleted_at IS NULL;

-- Composite index for user profile queries
-- Covers: User lookup with profile data in single query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_lookup 
ON users (id, email, first_name, last_name, image_url, username) 
WHERE deleted_at IS NULL;

-- User settings and preferences index
-- Covers: Fast settings retrieval for UI customization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_settings_timezone 
ON users (timezone, locale, onboarding_completed) 
WHERE deleted_at IS NULL;

-- Subscription-based user filtering
-- Covers: Plan-based queries and billing operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription 
ON users USING GIN (subscription) 
WHERE deleted_at IS NULL;

-- AI settings index for smart features
-- Covers: AI-enabled user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_ai_settings 
ON users USING GIN (ai_settings) 
WHERE deleted_at IS NULL;

-- =======================
-- WORKSPACE OPTIMIZATIONS
-- =======================

-- User workspace ownership index
-- Covers: User workspace listing and access control
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_owner_active 
ON workspaces (owner_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Workspace member access index
-- Covers: Multi-user workspace access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspace_members_user_workspace 
ON workspace_members (user_id, workspace_id, role) 
WHERE deleted_at IS NULL;

-- Personal workspace detection
-- Covers: Default workspace queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workspaces_personal 
ON workspaces (owner_id, is_personal) 
WHERE deleted_at IS NULL AND is_personal = true;

-- =======================
-- SESSION AND SECURITY OPTIMIZATIONS
-- =======================

-- Integration tokens index (if using database sessions)
-- Covers: OAuth token management and validation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_google_tokens 
ON users USING GIN (google_calendar_tokens) 
WHERE google_calendar_tokens IS NOT NULL 
AND deleted_at IS NULL;

-- User analytics tracking
-- Covers: Performance metrics and usage analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stats 
ON users (total_tasks_created, total_tasks_completed, streak_days) 
WHERE deleted_at IS NULL;

-- =======================
-- PERFORMANCE ANALYTICS TABLES
-- =======================

-- User analytics table for better performance tracking
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily metrics
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    habits_completed INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    session_duration INTEGER DEFAULT 0, -- minutes
    
    -- Engagement metrics
    login_count INTEGER DEFAULT 0,
    api_requests INTEGER DEFAULT 0,
    features_used TEXT[], -- Array of feature names
    
    -- Performance metrics
    avg_response_time DECIMAL(10,2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Indexes for analytics table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_user_date 
ON user_analytics (user_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_date 
ON user_analytics (date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_performance 
ON user_analytics (avg_response_time, error_count);

-- =======================
-- SESSION STORE TABLE (for Redis fallback)
-- =======================

-- High-performance session storage table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    session_data JSONB NOT NULL,
    fingerprint VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    
    -- Security tracking
    login_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT false,
    failed_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Session table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_active 
ON user_sessions (user_id, last_activity DESC) 
WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expiry 
ON user_sessions (expires_at) 
WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_fingerprint 
ON user_sessions (fingerprint, ip_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_suspicious 
ON user_sessions (is_suspicious, failed_attempts) 
WHERE is_suspicious = true;

-- =======================
-- PERFORMANCE MONITORING VIEWS
-- =======================

-- Real-time active users view
CREATE OR REPLACE VIEW active_users_view AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.last_active_at,
    EXTRACT(EPOCH FROM (NOW() - u.last_active_at))/60 as minutes_since_active,
    (u.subscription->>'plan') as plan,
    w.name as workspace_name
FROM users u
LEFT JOIN workspaces w ON u.id = w.owner_id AND w.is_personal = true
WHERE u.deleted_at IS NULL 
AND u.last_active_at > NOW() - INTERVAL '24 hours'
ORDER BY u.last_active_at DESC;

-- User performance summary view
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT 
    u.id,
    u.email,
    u.total_tasks_created,
    u.total_tasks_completed,
    CASE 
        WHEN u.total_tasks_created > 0 
        THEN ROUND((u.total_tasks_completed::DECIMAL / u.total_tasks_created) * 100, 2)
        ELSE 0 
    END as completion_rate,
    u.streak_days,
    u.longest_streak,
    u.created_at,
    EXTRACT(days FROM NOW() - u.created_at) as days_since_signup
FROM users u
WHERE u.deleted_at IS NULL
ORDER BY completion_rate DESC, u.total_tasks_completed DESC;

-- =======================
-- CLEANUP PROCEDURES
-- =======================

-- Stored procedure for session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO user_analytics (user_id, date, error_count)
    VALUES (NULL, CURRENT_DATE, -deleted_count)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure for user analytics aggregation
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS VOID AS $$
BEGIN
    -- Update analytics for active users
    INSERT INTO user_analytics (
        user_id, 
        date, 
        login_count, 
        session_duration
    )
    SELECT 
        s.user_id,
        CURRENT_DATE,
        COUNT(DISTINCT s.session_id),
        SUM(EXTRACT(EPOCH FROM (s.last_activity - s.login_at))/60)::INTEGER
    FROM user_sessions s
    WHERE s.login_at::date = CURRENT_DATE
    GROUP BY s.user_id
    ON CONFLICT (user_id, date) DO UPDATE SET
        login_count = EXCLUDED.login_count,
        session_duration = EXCLUDED.session_duration,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =======================
-- MAINTENANCE SCHEDULES
-- =======================

-- Schedule cleanup procedures (implement with pg_cron if available)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
-- SELECT cron.schedule('daily-analytics', '0 1 * * *', 'SELECT update_daily_analytics();');

-- =======================
-- PERFORMANCE MONITORING QUERIES
-- =======================

-- Query to check index usage
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Query to identify slow queries
-- SELECT 
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows,
--     100.0 * total_time / sum(total_time) OVER () as percentage
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 20;

-- Query to check table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
--     pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY size_bytes DESC;
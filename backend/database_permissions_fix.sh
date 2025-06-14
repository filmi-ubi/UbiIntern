#!/bin/bash
# Database Setup Script for UbiIntern Automation Platform

echo "🚀 Setting up automation_platform database..."

# 1. Create the webapp_service user if it doesn't exist
echo "📝 Creating webapp_service user..."
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'webapp_service') THEN
        CREATE USER webapp_service WITH ENCRYPTED PASSWORD 'webapp123';
    END IF;
END
\$\$;

-- Grant permissions on database
GRANT ALL PRIVILEGES ON DATABASE automation_platform TO webapp_service;
GRANT ALL PRIVILEGES ON SCHEMA public TO webapp_service;
EOF

# 2. Load the extensions
echo "🔧 Installing PostgreSQL extensions..."
sudo -u postgres psql -d automation_platform << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
EOF

# 3. Create essential tables for your current app
echo "📊 Creating essential tables..."
sudo -u postgres psql -d automation_platform << EOF
-- Organizations table (for your customer functionality)
CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name text NOT NULL,
    display_name text NOT NULL,
    organization_code text UNIQUE NOT NULL,
    email_domains text[] DEFAULT '{}',
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- WebApp users table (for authentication)
CREATE TABLE IF NOT EXISTS webapp_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    auth_provider text NOT NULL CHECK (auth_provider IN ('google', 'password', 'api_key')),
    password_hash text,
    user_type text NOT NULL CHECK (user_type IN ('employee', 'customer', 'partner', 'api')),
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamp,
    last_login_at timestamp,
    last_login_ip inet,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for JWT session management)
CREATE TABLE IF NOT EXISTS webapp_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token text UNIQUE NOT NULL,
    webapp_user_id uuid NOT NULL REFERENCES webapp_users(id),
    ip_address inet,
    user_agent text,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_webapp_users_email ON webapp_users(email);
CREATE INDEX IF NOT EXISTS idx_webapp_users_type ON webapp_users(user_type);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON webapp_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON webapp_sessions(webapp_user_id);

-- Grant permissions to webapp_service
GRANT ALL ON ALL TABLES IN SCHEMA public TO webapp_service;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO webapp_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO webapp_service;

-- Grant future permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO webapp_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO webapp_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO webapp_service;
EOF

echo "✅ Basic database setup complete!"

# 4. Test database connection
echo "🧪 Testing database connection..."
if sudo -u postgres psql -d automation_platform -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    
    # Show table count
    TABLE_COUNT=$(sudo -u postgres psql -d automation_platform -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo "📊 Created $TABLE_COUNT tables"
    
    # Test webapp_service user
    echo "🧪 Testing webapp_service user connection..."
    if PGPASSWORD=webapp123 psql -h localhost -U webapp_service -d automation_platform -c "SELECT current_user;" > /dev/null 2>&1; then
        echo "✅ webapp_service user can connect!"
    else
        echo "❌ webapp_service user connection failed"
        echo "   This might be due to pg_hba.conf settings"
    fi
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Database Details:"
echo "  - Database: automation_platform"
echo "  - User: webapp_service"
echo "  - Password: webapp123"
echo "  - Host: localhost"
echo "  - Port: 5432"
echo ""
echo "Your FastAPI app should now be able to connect to the database!"
echo ""
echo "Next steps:"
echo "1. Run: python3 setup_test_users.py"
echo "2. Start your FastAPI server: uvicorn main:app --reload"
echo "3. Test authentication in your React app"
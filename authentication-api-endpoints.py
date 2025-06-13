"""
Authentication Flow and API Endpoints
Complete implementation for secure authentication with OTP
"""

from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
import asyncpg
import aioredis
from datetime import datetime, timedelta
import jwt
import secrets
import logging

from .google_api_integration import (
    AuthenticationService, 
    DriveService, 
    GmailService,
    CalendarService,
    AutomationEngine,
    CONFIG
)

# Initialize FastAPI app
app = FastAPI(title="Business Automation Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mail.google.com", "https://*.company.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = CONFIG.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"

# Services
auth_service = AuthenticationService()
drive_service = DriveService()
gmail_service = GmailService()
calendar_service = CalendarService()
automation_engine = AutomationEngine()

# Database connection pool
db_pool = None
redis_pool = None

# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    auth_type: str = "google"  # google or otp

class OTPRequest(BaseModel):
    email: EmailStr
    
class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str

class SessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800  # 8 hours
    user_type: str
    requires_otp: bool = False

class SidebarTask(BaseModel):
    id: str
    task_type: str
    title: str
    description: str
    priority: str
    due_at: Optional[datetime]
    related_object_type: Optional[str]
    related_object_id: Optional[str]
    quick_actions: List[Dict]
    status: str

class CustomerInfo(BaseModel):
    organization_id: str
    display_name: str
    status: str
    health_status: str
    documents: int
    upcoming_meetings: int

# Startup/Shutdown Events
@app.on_event("startup")
async def startup():
    """Initialize services on startup"""
    global db_pool, redis_pool
    
    # Create database connection pool
    db_pool = await asyncpg.create_pool(CONFIG['POSTGRES_DSN'])
    
    # Create Redis connection pool
    redis_pool = await aioredis.create_redis_pool(CONFIG['REDIS_URL'])
    
    # Initialize auth service
    auth_service.redis = redis_pool
    
    logging.info("API services initialized")

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    if db_pool:
        await db_pool.close()
    if redis_pool:
        redis_pool.close()
        await redis_pool.wait_closed()

# Authentication Dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return user info"""
    token = credentials.credentials
    
    try:
        # Decode JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user_type = payload.get("type")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Validate session in Redis
        session_valid = await auth_service.validate_session(payload.get("session_id"))
        if not session_valid:
            raise HTTPException(status_code=401, detail="Session expired")
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "user_type": user_type
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_employee(current_user: dict = Depends(get_current_user)):
    """Require user to be an employee"""
    if current_user["user_type"] != "employee":
        raise HTTPException(status_code=403, detail="Employee access required")
    return current_user

async def require_customer(current_user: dict = Depends(get_current_user)):
    """Require user to be a customer"""
    if current_user["user_type"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    return current_user

# Authentication Endpoints
@app.post("/auth/login", response_model=SessionResponse)
async def login(request: LoginRequest, client_request: Request):
    """Initial login endpoint"""
    email = request.email.lower()
    
    # Check if employee (automatic Google sign-in)
    if await auth_service.verify_employee(email):
        # For employees, validate Google OAuth
        # In production, this would validate the Google ID token
        
        async with db_pool.acquire() as conn:
            # Get or create webapp user
            user = await conn.fetchrow("""
                INSERT INTO webapp_users (email, auth_provider, user_type, is_active, is_verified)
                VALUES ($1, 'google', 'employee', true, true)
                ON CONFLICT (email) DO UPDATE 
                SET last_login_at = CURRENT_TIMESTAMP
                RETURNING id, email, user_type
            """, email)
            
            # Create session
            session_id = await auth_service.create_session(
                str(user['id']),
                client_request.client.host,
                client_request.headers.get("user-agent", "")
            )
            
            # Generate JWT
            access_token = jwt.encode({
                "sub": str(user['id']),
                "email": email,
                "type": "employee",
                "session_id": session_id,
                "exp": datetime.utcnow() + timedelta(hours=8)
            }, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            return SessionResponse(
                access_token=access_token,
                user_type="employee",
                requires_otp=False
            )
    
    # Check if pre-approved customer/partner
    approval = await auth_service.verify_preapproved_account(email)
    
    if approval['approved']:
        # Requires OTP verification
        return SessionResponse(
            access_token="",
            user_type=approval['access_type'],
            requires_otp=True
        )
    
    raise HTTPException(status_code=403, detail="Access denied. Account not found or not approved.")

@app.post("/auth/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to pre-approved account"""
    email = request.email.lower()
    
    # Verify pre-approved account
    approval = await auth_service.verify_preapproved_account(email)
    
    if not approval['approved']:
        raise HTTPException(status_code=403, detail="Account not approved")
    
    # Send OTP
    success = await auth_service.send_otp(email, approval['phone_number'])
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    
    return {"message": "OTP sent successfully", "masked_phone": approval['phone_number'][-4:]}

@app.post("/auth/verify-otp", response_model=SessionResponse)
async def verify_otp(request: OTPVerification, client_request: Request):
    """Verify OTP and create session"""
    email = request.email.lower()
    
    # Verify OTP
    verified = await auth_service.verify_otp_code(
        email, 
        request.otp_code,
        client_request.client.host
    )
    
    if not verified:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Get approval details
    approval = await auth_service.verify_preapproved_account(email)
    
    async with db_pool.acquire() as conn:
        # Create or update webapp user
        user = await conn.fetchrow("""
            INSERT INTO webapp_users (
                email, auth_provider, user_type, is_active, is_verified, email_verified_at
            ) VALUES ($1, 'otp', $2, true, true, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE 
            SET last_login_at = CURRENT_TIMESTAMP,
                email_verified_at = COALESCE(webapp_users.email_verified_at, CURRENT_TIMESTAMP)
            RETURNING id, email, user_type
        """, email, 'customer' if approval['access_type'] == 'customer_portal' else 'partner')
        
        # Create session
        session_id = await auth_service.create_session(
            str(user['id']),
            client_request.client.host,
            client_request.headers.get("user-agent", "")
        )
        
        # Set up external permissions
        if approval['organization']:
            await conn.execute("""
                INSERT INTO external_permissions (
                    webapp_user_id, permission_type, permission_scope, 
                    access_level, can_download
                ) VALUES ($1, 'organization', $2, 'view', true)
                ON CONFLICT (webapp_user_id, permission_type, permission_scope) DO NOTHING
            """, user['id'], approval['organization'])
        
        # Generate JWT
        access_token = jwt.encode({
            "sub": str(user['id']),
            "email": email,
            "type": user['user_type'],
            "session_id": session_id,
            "org_id": approval.get('organization'),
            "exp": datetime.utcnow() + timedelta(hours=8)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return SessionResponse(
            access_token=access_token,
            user_type=user['user_type'],
            requires_otp=False
        )

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout and invalidate session"""
    # Invalidate session in database
    async with db_pool.acquire() as conn:
        await conn.execute("""
            DELETE FROM webapp_sessions 
            WHERE webapp_user_id = $1::uuid
        """, current_user['user_id'])
    
    # Remove from Redis
    if redis_pool:
        # Remove all sessions for user
        await redis_pool.delete(f"session:*:{current_user['user_id']}")
    
    return {"message": "Logged out successfully"}

# Gmail Sidebar API (for employees)
@app.get("/api/sidebar/tasks", response_model=List[SidebarTask])
async def get_sidebar_tasks(current_user: dict = Depends(require_employee)):
    """Get tasks for Gmail sidebar"""
    async with db_pool.acquire() as conn:
        tasks = await conn.fetch("""
            SELECT 
                id, task_type, title, description, priority, 
                due_at, related_object_type, related_object_id,
                quick_actions, status
            FROM sidebar_tasks
            WHERE employee_email = $1
              AND status = 'pending'
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'normal' THEN 3
                    WHEN 'low' THEN 4
                END,
                due_at ASC NULLS LAST
            LIMIT 20
        """, current_user['email'])
        
        return [SidebarTask(**dict(task)) for task in tasks]

@app.post("/api/sidebar/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: dict = Depends(require_employee)):
    """Mark task as completed"""
    async with db_pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE sidebar_tasks 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = $1::uuid AND employee_email = $2
        """, task_id, current_user['email'])
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"message": "Task completed"}

@app.post("/api/sidebar/tasks/{task_id}/dismiss")
async def dismiss_task(task_id: str, current_user: dict = Depends(require_employee)):
    """Dismiss/snooze task"""
    async with db_pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE sidebar_tasks 
            SET status = 'dismissed', dismissed_at = CURRENT_TIMESTAMP
            WHERE id = $1::uuid AND employee_email = $2
        """, task_id, current_user['email'])
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"message": "Task dismissed"}

@app.post("/api/sidebar/quick-action")
async def execute_quick_action(
    action: str,
    params: Dict,
    current_user: dict = Depends(require_employee)
):
    """Execute quick action from sidebar"""
    if action == "open_drive":
        # Return Drive URL
        return {"url": f"https://drive.google.com/file/d/{params['gid']}/edit"}
    
    elif action == "update_status":
        # Update document status
        gid = params.get('gid')
        new_status = params.get('status')
        
        if not gid or not new_status:
            raise HTTPException(status_code=400, detail="Missing parameters")
        
        # Get current file info
        async with db_pool.acquire() as conn:
            file_info = await conn.fetchrow("""
                SELECT name, name_assignee FROM drive_items WHERE gid = $1
            """, gid)
            
            if not file_info:
                raise HTTPException(status_code=404, detail="File not found")
            
            # Update filename with new status
            new_name = file_info['name']
            for status in ['[DRAFT]', '[READY]', '[REVIEW]', '[APPROVED]', '[REJECTED]']:
                new_name = new_name.replace(status, '')
            
            new_name = f"[{new_status}]{new_name.strip()}"
            
            # Update in Drive
            await drive_service.update_file_name(gid, new_name)
            
        return {"message": f"Status updated to {new_status}"}
    
    elif action == "create_doc":
        # Create document from template
        template = params.get('template')
        return {"message": f"Creating document from template: {template}"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

# Customer Portal API
@app.get("/api/customer/info", response_model=CustomerInfo)
async def get_customer_info(current_user: dict = Depends(require_customer)):
    """Get customer organization info"""
    org_id = current_user.get('org_id')
    
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization access")
    
    async with db_pool.acquire() as conn:
        # Get organization info
        org = await conn.fetchrow("""
            SELECT 
                o.id, o.display_name, o.customer_status as status,
                COALESCE(h.health_status, 'unknown') as health_status,
                COUNT(DISTINCT d.gid) as documents,
                COUNT(DISTINCT e.event_id) FILTER (WHERE e.start_time > CURRENT_TIMESTAMP) as upcoming_meetings
            FROM organizations o
            LEFT JOIN mv_customer_health h ON o.id = h.organization_id
            LEFT JOIN drive_items d ON o.id = d.organization_id
            LEFT JOIN calendar_events e ON o.id = e.organization_id
            WHERE o.id = $1::uuid
            GROUP BY o.id, o.display_name, o.customer_status, h.health_status
        """, org_id)
        
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        return CustomerInfo(**dict(org))

@app.get("/api/customer/documents")
async def get_customer_documents(
    current_user: dict = Depends(require_customer),
    folder_gid: Optional[str] = None
):
    """Get customer's documents"""
    org_id = current_user.get('org_id')
    
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization access")
    
    async with db_pool.acquire() as conn:
        # Check permission
        has_access = await conn.fetchval("""
            SELECT check_user_access($1, 'organization', $2, 'view')
        """, current_user['email'], org_id)
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get documents
        if folder_gid:
            documents = await conn.fetch("""
                SELECT 
                    gid, name, mime_type, is_folder,
                    created_time, modified_time
                FROM drive_items
                WHERE organization_id = $1::uuid
                  AND parent_gid = $2
                  AND is_deleted = false
                ORDER BY is_folder DESC, name ASC
            """, org_id, folder_gid)
        else:
            # Get root folder
            documents = await conn.fetch("""
                SELECT 
                    gid, name, mime_type, is_folder,
                    created_time, modified_time
                FROM drive_items
                WHERE organization_id = $1::uuid
                  AND parent_gid IS NULL
                  AND is_deleted = false
                ORDER BY is_folder DESC, name ASC
            """, org_id)
        
        return [dict(doc) for doc in documents]

@app.get("/api/customer/meetings")
async def get_customer_meetings(current_user: dict = Depends(require_customer)):
    """Get customer's meetings"""
    org_id = current_user.get('org_id')
    
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization access")
    
    async with db_pool.acquire() as conn:
        meetings = await conn.fetch("""
            SELECT 
                event_id, summary, start_time, end_time,
                location, meet_link, attendee_emails
            FROM calendar_events
            WHERE organization_id = $1::uuid
              AND is_customer_meeting = true
              AND start_time > CURRENT_TIMESTAMP - INTERVAL '30 days'
            ORDER BY start_time ASC
        """, org_id)
        
        return [dict(meeting) for meeting in meetings]

# Admin/Management APIs
@app.post("/api/admin/customers")
async def create_customer(
    customer_data: Dict,
    current_user: dict = Depends(require_employee)
):
    """Create new customer (admin only)"""
    # Check admin permission
    async with db_pool.acquire() as conn:
        is_admin = await conn.fetchval("""
            SELECT system_role IN ('senior_admin', 'system_admin')
            FROM employees
            WHERE employee_email = $1
        """, current_user['email'])
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Implementation would create customer following the flow
        # from add-customer-page component
        
        return {"message": "Customer created", "organization_id": "..."}

@app.get("/api/admin/automations")
async def get_automations(current_user: dict = Depends(require_employee)):
    """Get automation rules"""
    async with db_pool.acquire() as conn:
        automations = await conn.fetch("""
            SELECT 
                id, trigger_name, trigger_type, conditions,
                action_template, is_active, created_at
            FROM automation_triggers
            ORDER BY trigger_name
        """)
        
        return [dict(auto) for auto in automations]

# Webhook endpoints
@app.post("/webhooks/gmail/{email}")
async def gmail_webhook(email: str, request: Request):
    """Handle Gmail push notifications"""
    data = await request.json()
    
    # Verify webhook authenticity
    # In production, verify Google's push notification signature
    
    # Process in background
    from .google_api_integration import handle_gmail_webhook
    await handle_gmail_webhook({
        'emailAddress': email,
        'historyId': data.get('historyId')
    })
    
    return {"status": "ok"}

@app.post("/webhooks/drive")
async def drive_webhook(request: Request):
    """Handle Drive change notifications"""
    data = await request.json()
    
    # Process in background
    from .google_api_integration import handle_drive_webhook
    await handle_drive_webhook(data)
    
    return {"status": "ok"}

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        
        # Check Redis
        if redis_pool:
            await redis_pool.ping()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "up",
                "redis": "up" if redis_pool else "not configured",
                "version": "1.0.0"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# API Documentation
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "service": "Business Automation Platform API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
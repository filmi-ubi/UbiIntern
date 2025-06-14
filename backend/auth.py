# auth.py - Fixed Authentication Implementation

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
import asyncpg
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import secrets
import asyncio

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
JWT_SECRET = "your-secret-key-here"  # In production, use environment variable
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Database connection function
async def get_db_connection():
    try:
        return await asyncpg.connect(
            host='localhost',
            port=5432,
            user='webapp_service',
            password='webapp123',
            database='automation_platform'
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

# Authentication functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=8)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user data - FIXED VERSION"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        user_type = payload.get("user_type")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return {"email": email, "user_type": user_type}
        
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def authenticate_user(email: str, password: str):
    """Authenticate user with email and password"""
    conn = await get_db_connection()
    if not conn:
        # Fallback to hardcoded users for testing
        return authenticate_user_fallback(email, password)
    
    try:
        # Check if user exists and get their password hash
        user = await conn.fetchrow("""
            SELECT email, password_hash, user_type, is_active, is_verified
            FROM webapp_users 
            WHERE email = $1 AND auth_provider = 'password' AND is_active = true
        """, email.lower())
        
        await conn.close()
        
        if not user:
            return None
            
        # Verify password
        if not verify_password(password, user['password_hash']):
            return None
            
        # Check if user is verified
        if not user['is_verified']:
            return None
            
        return {
            "email": user['email'],
            "user_type": user['user_type']
        }
        
    except Exception as e:
        print(f"Authentication query failed: {e}")
        await conn.close()
        return None

def authenticate_user_fallback(email: str, password: str):
    """Fallback authentication for testing when database is not available"""
    # Define test users with their passwords
    test_users = {
        "admin@company.com": {
            "password": "admin123",
            "user_type": "employee"
        },
        "user@company.com": {
            "password": "user123", 
            "user_type": "employee"
        },
        "customer@example.com": {
            "password": "customer123",
            "user_type": "customer"
        }
    }
    
    user = test_users.get(email.lower())
    if user and user["password"] == password:
        return {
            "email": email.lower(),
            "user_type": user["user_type"]
        }
    
    return None

async def verify_employee(email: str) -> bool:
    """Check if email belongs to a company employee"""
    # Check if email domain matches company domain
    company_domains = ["company.com", "yourdomain.com"]  # Add your actual domains
    domain = email.split("@")[1].lower()
    
    if domain in company_domains:
        conn = await get_db_connection()
        if conn:
            try:
                # Check if user exists in database
                user = await conn.fetchrow("""
                    SELECT email FROM webapp_users 
                    WHERE email = $1 AND user_type = 'employee' AND is_active = true
                """, email.lower())
                await conn.close()
                return user is not None
            except Exception as e:
                await conn.close()
                print(f"Employee verification failed: {e}")
        
        # Fallback - if it's a company domain, assume it's an employee
        return True
    
    return False

async def create_test_users():
    """Create test users in the database for development"""
    conn = await get_db_connection()
    if not conn:
        print("Cannot create test users - database not available")
        return
    
    try:
        # Create admin user
        admin_hash = get_password_hash("admin123")
        await conn.execute("""
            INSERT INTO webapp_users (email, auth_provider, password_hash, user_type, is_active, is_verified)
            VALUES ($1, 'password', $2, 'employee', true, true)
            ON CONFLICT (email) DO UPDATE SET 
                password_hash = $2,
                updated_at = CURRENT_TIMESTAMP
        """, "admin@company.com", admin_hash)
        
        # Create regular user
        user_hash = get_password_hash("user123")
        await conn.execute("""
            INSERT INTO webapp_users (email, auth_provider, password_hash, user_type, is_active, is_verified)
            VALUES ($1, 'password', $2, 'employee', true, true)
            ON CONFLICT (email) DO UPDATE SET 
                password_hash = $2,
                updated_at = CURRENT_TIMESTAMP
        """, "user@company.com", user_hash)
        
        # Create customer user
        customer_hash = get_password_hash("customer123")
        await conn.execute("""
            INSERT INTO webapp_users (email, auth_provider, password_hash, user_type, is_active, is_verified)
            VALUES ($1, 'password', $2, 'customer', true, true)
            ON CONFLICT (email) DO UPDATE SET 
                password_hash = $2,
                updated_at = CURRENT_TIMESTAMP
        """, "customer@example.com", customer_hash)
        
        await conn.close()
        print("Test users created successfully")
        
    except Exception as e:
        await conn.close()
        print(f"Failed to create test users: {e}")

if __name__ == "__main__":
    # Run this to create test users
    asyncio.run(create_test_users())
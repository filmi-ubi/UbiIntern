from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# Security
SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "user_type": payload.get("user_type", "employee")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Mock user database (replace with real DB later)
users_db = {
    "admin@company.com": {"password": "admin123", "user_type": "employee"},
    "demo@customer.com": {"password": "demo123", "user_type": "customer"}
}

def authenticate_user(email: str, password: str):
    user = users_db.get(email)
    if user and user["password"] == password:
        return {"email": email, "user_type": user["user_type"]}
    return None

from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List
from auth import create_access_token, verify_token, authenticate_user
from google_drive import drive_manager
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="UbiIntern Automation Platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str

class CustomerCreate(BaseModel):
    legal_name: str
    display_name: str
    organization_code: str
    email_domains: List[str]
    primary_contact_email: str

class Customer(BaseModel):
    id: str
    legal_name: str
    display_name: str
    status: str

mock_customers = [
    {"id": "1", "legal_name": "Acme Corp", "display_name": "Acme", "status": "active"},
    {"id": "2", "legal_name": "TechStart Inc", "display_name": "TechStart", "status": "active"}
]

@app.get("/")
def root():
    return {"message": "UbiIntern Automation Platform API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "waiting_for_setup", "api": "ready"}

@app.post("/auth/login", response_model=LoginResponse)
def login(login_data: LoginRequest):
    user = authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user["email"], "user_type": user["user_type"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user["user_type"]
    }

@app.get("/api/customers", response_model=List[Customer])
def get_customers(current_user: dict = Depends(verify_token)):
    return mock_customers

@app.post("/api/customers")
def create_customer(customer: CustomerCreate, current_user: dict = Depends(verify_token)):
    try:
        folder_result = drive_manager.create_customer_folder(customer.legal_name)
        
        new_id = str(len(mock_customers) + 1)
        new_customer = {
            "id": new_id,
            "legal_name": customer.legal_name,
            "display_name": customer.display_name,
            "status": "active"
        }
        mock_customers.append(new_customer)
        
        return {
            "success": True, 
            "customer_id": new_id,
            "automation_triggered": True,
            "folder_created": folder_result["success"],
            "folder_id": folder_result.get("folder_id"),
            "folder_url": folder_result.get("folder_url"),
            "subfolders_created": folder_result.get("subfolders_created", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating customer: {str(e)}")

@app.get("/api/me")
def get_current_user(current_user: dict = Depends(verify_token)):
    return current_user

@app.get("/api/search")
def search(q: str, current_user: dict = Depends(verify_token)):
    results = []
    
    for customer in mock_customers:
        if q.lower() in customer["legal_name"].lower() or q.lower() in customer["display_name"].lower():
            results.append({
                "type": "customer",
                "id": customer["id"],
                "title": customer["legal_name"],
                "subtitle": customer["display_name"]
            })
    
    return {"query": q, "results": results}

@app.get("/api/google-status")
def google_api_status(current_user: dict = Depends(verify_token)):
    """Check Google API integration status"""
    
    # Check Drive API
    folder_test = drive_manager.list_customer_folders()
    
    return {
        "google_drive": {
            "status": "connected" if not drive_manager.mock_mode else "mock_mode",
            "mode": "real_api" if not drive_manager.mock_mode else "mock",
            "service_account_configured": not drive_manager.mock_mode,
            "test_result": folder_test
        },
        "gmail": {
            "status": "not_implemented",
            "message": "Gmail integration ready for implementation"
        },
        "calendar": {
            "status": "not_implemented", 
            "message": "Calendar integration ready for implementation"
        }
    }

@app.get("/api/folders")
def list_folders(current_user: dict = Depends(verify_token)):
    """List all customer folders"""
    return drive_manager.list_customer_folders()

from fastapi import FastAPI
from authentication_api_endpoints import app as auth_app

app = FastAPI(title="UbiIntern Automation Platform")

# Mount the authentication routes
app.mount("/auth", auth_app)

@app.get("/")
def root():
    return {"message": "UbiIntern Automation Platform API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
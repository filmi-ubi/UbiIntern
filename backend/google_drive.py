from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import json
import os

class GoogleDriveManager:
    def __init__(self, service_account_file=None):
        self.service_account_file = service_account_file or "/opt/automation-platform/service-account.json"
        self.service = None
        self.mock_mode = True
        
        try:
            if os.path.exists(self.service_account_file):
                self._initialize_service()
                self.mock_mode = False
                print("Google Drive API initialized successfully")
            else:
                print("Service account file not found, using mock mode")
        except Exception as e:
            print(f"Google API initialization failed: {e}, using mock mode")
    
    def _initialize_service(self):
        SCOPES = ['https://www.googleapis.com/auth/drive']
        credentials = Credentials.from_service_account_file(self.service_account_file, scopes=SCOPES)
        self.service = build('drive', 'v3', credentials=credentials)
    
    def create_customer_folder(self, company_name: str):
        if self.mock_mode:
            return self._mock_folder_creation(company_name)
        else:
            return self._real_folder_creation(company_name)
    
    def _mock_folder_creation(self, company_name: str):
        folder_id = f"folder_{company_name.replace(' ', '_').lower()}"
        subfolders = ["01_Contracts", "02_Projects", "03_Communications", "04_Training", "05_Reports"]
        
        return {
            "success": True,
            "mode": "mock",
            "folder_id": folder_id,
            "folder_url": f"https://drive.google.com/drive/folders/{folder_id}",
            "main_folder": f"{company_name} - Customer Files",
            "subfolders_created": subfolders,
            "message": "Mock folder creation - will be real when service account is configured"
        }
    
    def _real_folder_creation(self, company_name: str):
        try:
            main_folder_name = f"{company_name} - Customer Files"
            main_folder_metadata = {
                'name': main_folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            main_folder = self.service.files().create(body=main_folder_metadata, fields='id,name,webViewLink').execute()
            
            subfolders = ["01_Contracts", "02_Projects", "03_Communications", "04_Training", "05_Reports"]
            created_subfolders = []
            
            for subfolder_name in subfolders:
                subfolder_metadata = {
                    'name': subfolder_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [main_folder['id']]
                }
                subfolder = self.service.files().create(body=subfolder_metadata, fields='id,name').execute()
                created_subfolders.append({"name": subfolder['name'], "id": subfolder['id']})
            
            return {
                "success": True,
                "mode": "real_api",
                "folder_id": main_folder['id'],
                "folder_url": main_folder['webViewLink'],
                "main_folder": main_folder['name'],
                "subfolders_created": [sf['name'] for sf in created_subfolders],
                "message": "Real Google Drive folders created successfully"
            }
        except Exception as e:
            return {"success": False, "mode": "real_api", "error": str(e)}

drive_manager = GoogleDriveManager()

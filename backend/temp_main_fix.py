@app.post("/api/customers")
def create_customer(customer: CustomerCreate, current_user: dict = Depends(verify_token)):
    try:
        folder_result = drive_manager.create_customer_folder(customer.legal_name)
        
        new_id = str(len(mock_customers) + 1)
        new_customer = {"id": new_id, "legal_name": customer.legal_name, "display_name": customer.display_name, "status": "active"}
        mock_customers.append(new_customer)
        
        return {
            "success": True, 
            "customer_id": new_id,
            "automation_triggered": True,
            "folder_created": folder_result["success"],
            "folder_id": folder_result.get("folder_id"),
            "folder_url": folder_result.get("folder_url"),
            "subfolders_created": folder_result["subfolders_created"],  # Remove .get() and []
            "mode": folder_result.get("mode", "unknown"),
            "message": folder_result.get("message", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating customer: {str(e)}")

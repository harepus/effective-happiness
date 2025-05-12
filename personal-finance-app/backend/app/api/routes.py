import logging
from fastapi import APIRouter, File, UploadFile, Header
from typing import Optional
import requests
from ..services.parser import parse_file
from ..services.trumf_api import TrumfAPI

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a bank transaction file."""
    return await parse_file(file)

@router.get("/trumf/transactions")
async def get_trumf_transactions(authorization: Optional[str] = Header(None), limit: int = 100):
    """
    Get transaction history from Trumf.
    
    Requires an authorization header with a valid Trumf JWT token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return {"error": "Missing or invalid authorization header. Must be 'Bearer <token>'"}
    
    token = authorization.replace("Bearer ", "")
    trumf_api = TrumfAPI(token)
    
    try:
        transactions = trumf_api.get_transactions(limit)
        return {"transactions": transactions}
    except Exception as e:
        return {"error": str(e)}

@router.get("/trumf/receipts/{batch_id}")
async def get_trumf_receipt(batch_id: str, authorization: Optional[str] = Header(None)):
    """
    Get detailed receipt data for a specific Trumf transaction.
    
    Requires an authorization header with a valid Trumf JWT token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return {"error": "Missing or invalid authorization header. Must be 'Bearer <token>'"}
    
    token = authorization.replace("Bearer ", "")
    trumf_api = TrumfAPI(token)
    
    try:
        receipt = trumf_api.get_receipt(batch_id)
        return {"receipt": receipt}
    except Exception as e:
        logger.exception(f"Error in get_trumf_receipt: {e}")
        return {"error": str(e)}

@router.get("/trumf/direct-debug/{batch_id}")
async def direct_debug_trumf_receipt(batch_id: str, authorization: Optional[str] = Header(None)):
    """
    Directly extract and display receipt items with minimal processing for debugging.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return {"error": "Missing or invalid authorization header. Must be 'Bearer <token>'"}
    
    token = authorization.replace("Bearer ", "")
    
    try:
        receipt_url = f"https://platform-rest-prod.ngdata.no/trumf/medlemskap/transaksjoner/digitalkvittering/{batch_id}"
        
        response = requests.get(
            receipt_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Direct extraction with minimal processing
            processed_items = []
            
            if isinstance(data, dict) and 'varelinjer' in data:
                for item in data['varelinjer']:
                    if isinstance(item, dict):
                        processed_item = {
                            "name": item.get('produktBeskrivelse', 'Unknown'),
                            "price": item.get('belop', 0),
                            "quantity": item.get('antall', 1),
                        }
                        processed_items.append(processed_item)
            
            return {
                "statusCode": 200,
                "processedItems": processed_items,
                "itemCount": len(processed_items),
                "receipt": data  # Include full receipt data for reference
            }
        else:
            return {
                "statusCode": response.status_code,
                "error": f"API returned status code {response.status_code}",
                "response": response.text
            }
    except Exception as e:
        logger.exception(f"Error in direct debug: {e}")
        return {"error": str(e)}
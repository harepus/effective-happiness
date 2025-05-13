import logging
from fastapi import APIRouter, File, UploadFile, Header, HTTPException
from typing import Optional
import requests
from datetime import datetime
from ..services.parser import parse_file
from ..services.trumf_api import TrumfAPI
from ..services.analytics import generate_comprehensive_report

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and process a bank transaction file.
    Returns transaction data with detailed categorization based on the hierarchical categories.
    """
    logger.debug(f"Received file upload: {file.filename}")
    try:
        logger.debug("Parsing file...")
        result = await parse_file(file)
        logger.debug(f"Parse result: {result.keys() if isinstance(result, dict) else 'Error'}")
        
        # Check for specific error keys
        if isinstance(result, dict) and "error" in result:
            logger.error(f"Error in file parsing: {result['error']}")
            # Return the error but with a 200 status code to avoid CORS issues
            return result
            
        return result
    except Exception as e:
        logger.exception(f"Error processing file: {str(e)}")
        # Return error as part of response body instead of raising HTTP exception
        # to avoid CORS issues with error responses
        return {"error": f"Failed to process file: {str(e)}"}

@router.post("/analyze")
async def analyze_transactions(transactions: list):
    """
    Generate a comprehensive financial report from transaction data.
    
    Args:
        transactions: List of transaction objects
        
    Returns:
        Dictionary with comprehensive financial report
    """
    try:
        if not transactions:
            raise HTTPException(status_code=400, detail="No transaction data provided")
            
        report = generate_comprehensive_report(transactions)
        return report
    except Exception as e:
        logger.exception(f"Error generating financial report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate financial report: {str(e)}")

@router.get("/trumf/transactions")
async def get_trumf_transactions(authorization: Optional[str] = Header(None)):
    """
    Get transaction history from Trumf.
    Requires an authorization header with a valid Trumf JWT token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid authorization header. Must be 'Bearer <token>'"
        )
    
    token = authorization.replace("Bearer ", "")
    trumf_api = TrumfAPI(token)
    
    try:
        transactions = trumf_api.get_transactions()
        return {"transactions": transactions}
    except Exception as e:
        logger.exception(f"Error fetching Trumf transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trumf/receipts/{batch_id}")
async def get_trumf_receipt(batch_id: str, authorization: Optional[str] = Header(None)):
    """
    Get detailed receipt data for a specific Trumf transaction.
    Requires an authorization header with a valid Trumf JWT token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid authorization header. Must be 'Bearer <token>'"
        )
    
    token = authorization.replace("Bearer ", "")
    trumf_api = TrumfAPI(token)
    
    try:
        receipt = trumf_api.get_receipt(batch_id)
        return {"receipt": receipt}
    except Exception as e:
        logger.exception(f"Error getting receipt for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/test")
async def test_route():
    """
    Simple test route to verify the API is running.
    """
    logger.debug("Test route accessed")
    return {"status": "ok", "message": "API is running"}
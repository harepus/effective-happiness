import requests
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class TrumfAPI:
    """Service for interacting with the Trumf API."""
    
    TRANSACTIONS_URL = "https://platform-rest-prod.ngdata.no/trumf/medlemskap/transaksjoner"
    
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
    
    def get_transactions(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get list of transactions from Trumf.
        """
        try:
            response = requests.get(
                f"{self.TRANSACTIONS_URL}?limit={limit}", 
                headers=self.headers
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Extract transactions from the response
            if isinstance(data, dict) and 'transactions' in data:
                return data['transactions']
            return data
            
        except requests.RequestException as e:
            logger.error(f"Error fetching Trumf transactions: {e}")
            raise Exception(f"Failed to fetch transactions: {str(e)}")
    
    def get_receipt(self, batch_id: str) -> Dict[str, Any]:
        """
        Get detailed receipt for a specific transaction using its batch ID.
        """
        try:
            receipt_url = f"https://platform-rest-prod.ngdata.no/trumf/medlemskap/transaksjoner/digitalkvittering/{batch_id}"
            
            logger.info(f"Fetching receipt data from: {receipt_url}")
            response = requests.get(receipt_url, headers=self.headers)
            
            if response.status_code == 200:
                receipt_data = response.json()
                
                # Process items from the varelinjer array
                processed_items = []
                
                if isinstance(receipt_data, dict) and 'varelinjer' in receipt_data:
                    for item in receipt_data['varelinjer']:
                        if not isinstance(item, dict):
                            continue
                        
                        processed_item = {
                            "name": item.get('produktBeskrivelse', 'Unknown Product'),
                            "price": float(item.get('belop', 0)),
                            "quantity": float(item.get('antall', 1)),
                        }
                        processed_items.append(processed_item)
                        
                    logger.info(f"Processed {len(processed_items)} items from receipt")
                
                # Return combined data
                return {
                    "receipt_data": receipt_data,
                    "processed_items": processed_items,
                    "store": receipt_data.get('butikkId', 'Unknown Store'),
                    "date": receipt_data.get('transaksjonsTidspunkt', ''),
                    "total": float(receipt_data.get('belop', 0)),
                }
            else:
                logger.error(f"Failed to fetch receipt: {response.status_code}, {response.text}")
                raise Exception(f"Failed to fetch receipt: {response.status_code}")
                
        except Exception as e:
            logger.exception(f"Error getting receipt for batch {batch_id}: {e}")
            raise Exception(f"Failed to fetch receipt: {str(e)}")
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class Transaction(BaseModel):
    date: date
    description: str
    amount: float
    category: str

class TransactionResponse(BaseModel):
    transactions: List[Transaction]
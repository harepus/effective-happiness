from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import date

class Transaction(BaseModel):
    date: date
    description: str
    amount: float
    category: str
    is_expense: bool

class CategoryStats(BaseModel):
    total: float = Field(0)
    subcategories: Dict[str, float] = Field(default_factory=dict)

class MonthlyData(BaseModel):
    income: float = Field(0)
    expenses: float = Field(0)

class TransactionStats(BaseModel):
    income: CategoryStats = Field(default_factory=CategoryStats)
    expenses: CategoryStats = Field(default_factory=CategoryStats)
    daily_expenses: Dict[str, float] = Field(default_factory=dict)
    monthly_summary: Dict[str, MonthlyData] = Field(default_factory=dict)

class TransactionResponse(BaseModel):
    transactions: List[Transaction]
    stats: TransactionStats
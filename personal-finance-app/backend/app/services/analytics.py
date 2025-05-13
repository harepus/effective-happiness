import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

def calculate_basic_stats(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate basic statistics from a list of transactions.
    
    Args:
        transactions: List of transaction objects
        
    Returns:
        Dictionary containing basic statistics
    """
    # Initialize stats dictionary
    stats = {
        "expenses": {
            "total": 0,
            "subcategories": {},
            "categories": {}  # For parent categories
        },
        "income": {
            "total": 0,
            "subcategories": {}
        },
        "daily_expenses": {},
        "monthly_summary": {},
        "transfers": 0,
        "investments": 0
    }
    
    # Process each transaction
    for transaction in transactions:
        amount = transaction.get("amount", 0)
        date_str = transaction.get("date", "")
        main_category = transaction.get("main_category", "")
        parent_category = transaction.get("parent_category", "")
        subcategory = transaction.get("subcategory", "")
        
        try:
            # Parse date
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            day = date_obj.strftime("%Y-%m-%d")
            month = date_obj.strftime("%Y-%m")
            
            # Update daily expenses
            if transaction.get("is_expense", False):
                stats["daily_expenses"][day] = stats["daily_expenses"].get(day, 0) + abs(amount)
            
            # Update monthly summary
            if month not in stats["monthly_summary"]:
                stats["monthly_summary"][month] = {"income": 0, "expenses": 0}
            
            # Update main category stats
            if main_category == "expenses":
                stats["expenses"]["total"] += abs(amount)
                
                # Update parent category
                if parent_category:
                    stats["expenses"]["categories"][parent_category] = (
                        stats["expenses"]["categories"].get(parent_category, 0) + abs(amount)
                    )
                
                # Update subcategory
                if subcategory:
                    stats["expenses"]["subcategories"][subcategory] = (
                        stats["expenses"]["subcategories"].get(subcategory, 0) + abs(amount)
                    )
                
                # Update monthly summary
                stats["monthly_summary"][month]["expenses"] += abs(amount)
                
            elif main_category == "income":
                stats["income"]["total"] += amount
                
                # Update subcategory
                if subcategory:
                    stats["income"]["subcategories"][subcategory] = (
                        stats["income"]["subcategories"].get(subcategory, 0) + amount
                    )
                
                # Update monthly summary
                stats["monthly_summary"][month]["income"] += amount
                
            elif main_category == "transfers":
                stats["transfers"] += abs(amount)
                
            elif main_category == "investments":
                stats["investments"] += abs(amount)
        
        except Exception as e:
            logger.warning(f"Error processing transaction for stats: {e}")
            continue
    
    return stats

def analyze_spending_patterns(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze spending patterns in the transaction data.
    
    Args:
        transactions: List of transaction objects
        
    Returns:
        Dictionary with spending pattern analysis
    """
    if not transactions:
        return {"error": "No transaction data provided"}
    
    try:
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(transactions)
        
        # Skip if no expense transactions
        if "is_expense" not in df.columns or not df["is_expense"].any():
            return {"error": "No expense transactions found"}
        
        # Filter expenses
        expenses_df = df[df["is_expense"] == True].copy()
        
        # Add date parts
        expenses_df["date_obj"] = pd.to_datetime(expenses_df["date"])
        expenses_df["day_of_week"] = expenses_df["date_obj"].dt.day_name()
        expenses_df["month"] = expenses_df["date_obj"].dt.month
        expenses_df["year"] = expenses_df["date_obj"].dt.year
        
        # Calculate average daily spend
        daily_spend = expenses_df.groupby(expenses_df["date_obj"].dt.date)["amount"].sum().abs()
        avg_daily_spend = daily_spend.mean()
        
        # Find day of week with highest spending
        dow_spend = expenses_df.groupby("day_of_week")["amount"].sum().abs()
        highest_spend_day = dow_spend.idxmax() if not dow_spend.empty else "N/A"
        
        # Most expensive categories
        category_spend = expenses_df.groupby("parent_category")["amount"].sum().abs()
        top_categories = category_spend.nlargest(3).to_dict() if not category_spend.empty else {}
        
        # Calculate recurring expenses (appearing multiple times)
        description_counts = expenses_df["description"].value_counts()
        recurring_expenses = description_counts[description_counts > 1].index.tolist()
        
        # Summary of recurring expenses
        recurring_summary = []
        for desc in recurring_expenses[:10]:  # Limit to 10 most common
            matching_txns = expenses_df[expenses_df["description"] == desc]
            avg_amount = matching_txns["amount"].abs().mean()
            recurring_summary.append({
                "description": desc,
                "count": len(matching_txns),
                "average_amount": avg_amount,
                "category": matching_txns["parent_category"].iloc[0] if not matching_txns.empty else "Unknown"
            })
        
        return {
            "average_daily_spend": float(avg_daily_spend),
            "highest_spend_day": highest_spend_day,
            "top_spending_categories": top_categories,
            "recurring_expenses": recurring_summary,
        }
    
    except Exception as e:
        logger.exception(f"Error analyzing spending patterns: {e}")
        return {"error": f"Failed to analyze spending patterns: {str(e)}"}

def generate_nordnet_investment_summary(nordnet_transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate summary statistics for Nordnet investments.
    
    Args:
        nordnet_transactions: List of Nordnet transaction objects
        
    Returns:
        Dictionary with investment summary
    """
    if not nordnet_transactions:
        return {"error": "No Nordnet transaction data provided"}
    
    try:
        df = pd.DataFrame(nordnet_transactions)
        
        # Calculate total invested amount
        total_invested = df["amount"].sum()
        
        # Group by investment type (if available)
        investment_by_type = {}
        if "investment_type" in df.columns:
            investment_by_type = df.groupby("investment_type")["amount"].sum().to_dict()
        
        # Calculate monthly investment trends
        if "date" in df.columns:
            df["date_obj"] = pd.to_datetime(df["date"])
            df["month"] = df["date_obj"].dt.strftime("%Y-%m")
            monthly_investments = df.groupby("month")["amount"].sum().to_dict()
        else:
            monthly_investments = {}
        
        return {
            "total_invested": float(total_invested),
            "investment_by_type": investment_by_type,
            "monthly_investments": monthly_investments
        }
    
    except Exception as e:
        logger.exception(f"Error analyzing Nordnet investments: {e}")
        return {"error": f"Failed to analyze Nordnet investments: {str(e)}"}

def generate_comprehensive_report(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a comprehensive financial report from transaction data.
    
    Args:
        transactions: List of transaction objects
        
    Returns:
        Dictionary with comprehensive financial report
    """
    # Get basic stats
    basic_stats = calculate_basic_stats(transactions)
    
    # Get spending patterns
    spending_patterns = analyze_spending_patterns(transactions)
    
    # Filter Nordnet transactions
    nordnet_transactions = [
        t for t in transactions 
        if "nordnet" in t.get("description", "").lower() or t.get("main_category") == "investments"
    ]
    
    # Get investment summary if there are any Nordnet transactions
    investment_summary = generate_nordnet_investment_summary(nordnet_transactions) if nordnet_transactions else {}
    
    # Calculate savings rate if we have income data
    savings_rate = None
    if basic_stats["income"]["total"] > 0:
        savings = basic_stats["income"]["total"] - basic_stats["expenses"]["total"]
        savings_rate = (savings / basic_stats["income"]["total"]) * 100
    
    return {
        "stats": basic_stats,
        "spending_patterns": spending_patterns,
        "investment_summary": investment_summary,
        "savings_rate": savings_rate,
        "transaction_count": len(transactions),
        "expense_count": sum(1 for t in transactions if t.get("is_expense", False)),
        "income_count": sum(1 for t in transactions if not t.get("is_expense", False)),
    }

import io
import pandas as pd
import numpy as np
import math
import logging
from fastapi import UploadFile
from datetime import datetime
from .categorization import categorize, CATEGORY_HIERARCHY
from typing import Dict, List, Any, Optional
import json

logger = logging.getLogger(__name__)

def parse_norwegian_date(date_str):
    """Parse a Norwegian formatted date string into a datetime object."""
    formats = [
        "%d.%m.%Y",  # 31.12.2023
        "%Y-%m-%d",   # 2023-12-31
        "%d/%m/%Y",  # 31/12/2023
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # If no format worked, try the original string
    return datetime.fromisoformat(date_str)

# Helper function to ensure JSON serializable values
def ensure_serializable(obj):
    """Convert non-serializable values to serializable ones."""
    if isinstance(obj, dict):
        return {k: ensure_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [ensure_serializable(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, float)):
        float_val = float(obj)
        if math.isnan(float_val) or math.isinf(float_val):
            return 0.0  # Replace NaN/Inf with 0
        return float_val
    elif isinstance(obj, np.ndarray):
        return ensure_serializable(obj.tolist())
    elif obj is None:
        return None
    else:
        try:
            # Try standard JSON serialization
            json.dumps(obj)
            return obj
        except (TypeError, OverflowError):
            # Fall back to string representation
            return str(obj)

# Safe function to convert values to float and handle errors
def safe_float(value, default=0.0):
    """Safely convert a value to float, returning default if it fails."""
    try:
        result = float(value)
        return 0.0 if math.isnan(result) or math.isinf(result) else result
    except (ValueError, TypeError):
        return default

async def parse_file(file: UploadFile) -> Dict[str, Any]:
    """
    Parse a bank transaction file and categorize transactions.
    
    Args:
        file: The uploaded file (CSV, TXT, or XLSX)
        
    Returns:
        Dict containing transactions and statistics
    """
    try:
        contents = await file.read()
        
        # Dictionary to store parsed data
        result = {
            "transactions": [],
            "stats": {
                "expenses": {
                    "total": 0.0,
                    "subcategories": {},
                    "categories": {}  # For parent categories
                },
                "income": {
                    "total": 0.0,
                    "subcategories": {}
                },
                "daily_expenses": {},
                "monthly_summary": {}
            }
        }
        
        # Initialize subcategory stats
        for main_cat, main_data in CATEGORY_HIERARCHY.items():
            if main_cat in ["expenses", "income"]:
                # Make sure both main categories have the necessary structure
                if "categories" not in result["stats"][main_cat]:
                    result["stats"][main_cat]["categories"] = {}
                if "subcategories" not in result["stats"][main_cat]:
                    result["stats"][main_cat]["subcategories"] = {}
                
                for category, cat_data in main_data.items():
                    # Initialize the category total
                    result["stats"][main_cat]["categories"][category] = 0.0
                    
                    for subcat in cat_data["subcategories"]:
                        result["stats"][main_cat]["subcategories"][subcat] = 0.0
                        
        # Initialize special categories
        result["stats"]["transfers"] = 0.0
        result["stats"]["investments"] = 0.0
        
        # Determine file type and read data
        if file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith((".txt", ".csv")):
            # Try with different delimiters
            try:
                df = pd.read_csv(io.BytesIO(contents), sep=";", encoding="utf-8")
            except:
                try:
                    df = pd.read_csv(io.BytesIO(contents), sep=",", encoding="utf-8")
                except:
                    return {"error": "Could not parse file. Make sure it's a valid CSV or TXT with semicolon or comma separators."}
        else:
            return {"error": "Unsupported file type. Please upload .txt, .csv, or .xlsx"}
        
        # Normalize column names to lowercase
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Try to identify standard column patterns
        date_columns = [col for col in df.columns if any(x in col.lower() for x in ["dato", "date"])]
        description_columns = [col for col in df.columns if any(x in col.lower() for x in ["forklaring", "description", "tekst", "text"])]
        out_amount_columns = [col for col in df.columns if any(x in col.lower() for x in ["ut", "out", "debit", "debet"])]
        in_amount_columns = [col for col in df.columns if any(x in col.lower() for x in ["inn", "in", "kredit", "credit"])]
        
        # Fall back to position-based if columns can't be identified
        if not date_columns and len(df.columns) >= 3:
            date_columns = [df.columns[0]]
        if not description_columns and len(df.columns) >= 3:
            description_columns = [df.columns[1]]
            
        # If we couldn't identify in/out columns, look for a single amount column
        amount_columns = [col for col in df.columns if any(x in col.lower() for x in ["beløp", "amount"])]
        
        if not date_columns or (not description_columns):
            return {"error": "Could not identify required columns in the file. Please check the format."}
        
        # Select the columns we'll use
        date_col = date_columns[0]
        desc_col = description_columns[0]
        
        # For amounts, we need either (in AND out) OR (a single amount column)
        if out_amount_columns and in_amount_columns:
            out_col = out_amount_columns[0]
            in_col = in_amount_columns[0]
            has_separate_amount_cols = True
        elif amount_columns:
            amount_col = amount_columns[0]
            has_separate_amount_cols = False
        else:
            # Try to use the remaining columns as amount columns
            remaining_cols = [col for col in df.columns if col not in date_columns + description_columns]
            if len(remaining_cols) >= 2:
                out_col, in_col = remaining_cols[:2]
                has_separate_amount_cols = True
            elif len(remaining_cols) == 1:
                amount_col = remaining_cols[0]
                has_separate_amount_cols = False
            else:
                return {"error": "Could not identify amount columns in the file."}
        
        # Process each row
        for _, row in df.iterrows():
            try:
                # Extract description
                description = str(row[desc_col]) if not pd.isna(row[desc_col]) else ""
                
                # Extract amount
                if has_separate_amount_cols:
                    out_amount = safe_float(row[out_col], 0.0)
                    in_amount = safe_float(row[in_col], 0.0)
                    
                    # Determine if expense or income
                    is_expense = out_amount > 0
                    amount = -out_amount if is_expense else in_amount
                else:
                    # Single amount column - negative is expense, positive is income
                    amount = safe_float(row[amount_col], 0.0)
                    is_expense = amount < 0
                
                # Skip rows with zero amount
                if amount == 0:
                    continue
                
                # Parse date
                date_str = str(row[date_col]) if not pd.isna(row[date_col]) else ""
                if not date_str:
                    continue
                
                try:
                    date_obj = parse_norwegian_date(date_str)
                    date_iso = date_obj.strftime("%Y-%m-%d")
                    month_year = date_obj.strftime("%Y-%m")
                    weekday = date_obj.strftime("%a")
                except Exception as e:
                    # Use the raw date string if parsing fails
                    date_iso = date_str
                    month_year = "unknown"
                    weekday = "unknown"
                    logger.warning(f"Failed to parse date: {date_str}, error: {str(e)}")
                
                # Categorize transaction using the hierarchical system
                category_info = categorize(description, use_hierarchy=True)
                
                # Format for the transaction object
                if isinstance(category_info, dict):
                    category_name = f"{category_info['category']}.{category_info['subcategory']}"
                    display_name = category_info['display_name']
                    main_category = category_info['main_category']
                    parent_category = category_info['category']
                    subcategory = category_info['subcategory']
                else:
                    # Special categories like 'transfers' or 'investments'
                    category_name = category_info
                    display_name = category_info.capitalize()
                    main_category = category_info
                    parent_category = category_info
                    subcategory = category_info
                
                # If it's not an expense but wasn't categorized as income, force it as income
                if not is_expense and main_category != "income":
                    # Override the categorization for non-expenses
                    main_category = "income"
                    parent_category = "other_income"
                    subcategory = "uncategorized_income"
                    category_name = f"{parent_category}.{subcategory}"
                    display_name = "Other Income"
                    logger.debug(f"Forced income categorization for: {description} with amount {amount}")
                
                # Create transaction object
                transaction = {
                    "date": date_iso,
                    "description": description,
                    "amount": round(safe_float(amount), 2),
                    "is_expense": is_expense,
                    "category": category_name,
                    "display_category": display_name,
                    "main_category": main_category,
                    "parent_category": parent_category,
                    "subcategory": subcategory
                }
                
                # Add to the transactions list
                result["transactions"].append(transaction)
                
                # Update statistics
                abs_amount = abs(safe_float(amount))
                
                # Update main category totals (income/expenses)
                if main_category in ["expenses", "income"]:
                    if is_expense and main_category == "expenses":
                        result["stats"]["expenses"]["total"] += abs_amount
                        
                        # Update parent category totals
                        if parent_category in result["stats"]["expenses"]["categories"]:
                            result["stats"]["expenses"]["categories"][parent_category] += abs_amount
                        
                        # Update subcategory
                        if subcategory in result["stats"]["expenses"]["subcategories"]:
                            result["stats"]["expenses"]["subcategories"][subcategory] += abs_amount
                        
                        # Add to daily expenses
                        if weekday != "unknown":
                            if weekday not in result["stats"]["daily_expenses"]:
                                result["stats"]["daily_expenses"][weekday] = 0.0
                            result["stats"]["daily_expenses"][weekday] += abs_amount
                            
                    elif not is_expense and main_category == "income":
                        result["stats"]["income"]["total"] += abs_amount
                        
                        # Update subcategory
                        if subcategory in result["stats"]["income"]["subcategories"]:
                            result["stats"]["income"]["subcategories"][subcategory] += abs_amount
                
                # Update special categories
                elif main_category in ["transfers", "investments"]:
                    result["stats"][main_category] += abs_amount
                
                # Update monthly summary
                if month_year != "unknown":
                    if month_year not in result["stats"]["monthly_summary"]:
                        result["stats"]["monthly_summary"][month_year] = {"income": 0.0, "expenses": 0.0}
                        logger.debug(f"Created new monthly summary entry for {month_year}")
                    
                    if is_expense:
                        result["stats"]["monthly_summary"][month_year]["expenses"] += abs_amount
                    else:
                        # For income transactions
                        prev_income = result["stats"]["monthly_summary"][month_year]["income"]
                        result["stats"]["monthly_summary"][month_year]["income"] += abs_amount
                        logger.debug(f"Adding income: {abs_amount} to {month_year}, description: {description}, is_expense: {is_expense}")
                        logger.debug(f"Monthly income for {month_year} updated from {prev_income} to {result['stats']['monthly_summary'][month_year]['income']}")
                        
            except Exception as e:
                # Log error but continue with next row
                logger.error(f"Error processing row: {str(e)}")
                continue
        
        # Clean up empty categories
        for main_cat in ["expenses", "income"]:
            # Clean parent categories
            for parent_cat in list(result["stats"][main_cat]["categories"].keys()):
                if result["stats"][main_cat]["categories"][parent_cat] == 0:
                    del result["stats"][main_cat]["categories"][parent_cat]
            
            # Clean subcategories
            for subcat in list(result["stats"][main_cat]["subcategories"].keys()):
                if result["stats"][main_cat]["subcategories"][subcat] == 0:
                    del result["stats"][main_cat]["subcategories"][subcat]
        
        # Add error message if no transactions were processed
        if not result["transactions"]:
            result["warning"] = "No valid transactions found in the file."
        
        # Log the monthly summary for debugging
        logger.debug(f"Monthly summary before serialization: {result['stats']['monthly_summary']}")
            
        # Ensure all values are serializable
        serializable_result = ensure_serializable(result)
        
        # Double check all floats are serializable
        for i, transaction in enumerate(serializable_result["transactions"]):
            if "amount" in transaction:
                # Ensure amounts are proper floats with 2 decimal places
                amount = transaction["amount"]
                if isinstance(amount, (float, int)):
                    serializable_result["transactions"][i]["amount"] = round(float(amount), 2)
                else:
                    serializable_result["transactions"][i]["amount"] = 0.0
        
        # Ensure stats amounts are serializable
        for main_cat in ["expenses", "income"]:
            # Ensure total is a valid float
            serializable_result["stats"][main_cat]["total"] = round(float(
                serializable_result["stats"][main_cat]["total"]), 2)
        
        return serializable_result
        
    except Exception as e:
        logger.exception(f"Error parsing file: {str(e)}")
        return {"error": f"Failed to parse file: {str(e)}"}
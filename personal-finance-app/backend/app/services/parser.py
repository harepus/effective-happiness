import io
import pandas as pd
from fastapi import UploadFile
from datetime import datetime
from .categorization import categorize

async def parse_file(file: UploadFile):
    contents = await file.read()

    # Determine file type
    if file.filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))
    elif file.filename.endswith(".txt"):
        df = pd.read_csv(io.BytesIO(contents), sep=";", encoding="utf-8")
    else:
        return {"error": "Unsupported file type"}

    # Clean column names
    df.columns = [col.strip().lower() for col in df.columns]

    # Extract necessary fields
    transactions = []
    for _, row in df.iterrows():
        desc = str(row.get("forklaring", ""))
        out = row.get("ut fra konto", 0)
        inc = row.get("inn på konto", 0)
        
        # Handle empty or non-numeric values
        if pd.isna(out) or out == "":
            out = 0
        if pd.isna(inc) or inc == "":
            inc = 0
            
        amount = -float(out) if float(out) > 0 else float(inc)
        
        # Parse date in Norwegian format (DD.MM.YYYY)
        date_str = row.get("dato", "")
        date_obj = None
        if date_str and not pd.isna(date_str):
            try:
                date_obj = datetime.strptime(date_str, "%d.%m.%Y").strftime("%Y-%m-%d")
            except ValueError:
                date_obj = date_str

        transactions.append({
            "date": date_obj,
            "description": desc,
            "amount": round(amount, 2),
            "category": categorize(desc)
        })

    return {"transactions": transactions}
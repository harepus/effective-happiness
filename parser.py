from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import io

app = FastAPI()

# CORS setup for local frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keyword-based category mapping
CATEGORY_KEYWORDS = {
    "groceries": ["kiwi", "bunnpris", "rema", "coop", "meny"],
    "subscriptions": ["spotify", "netflix", "viaplay", "youtube", "sats", "apple" "gjensidige"],
    "clothing": ["zara", "h&m", "bikbok"],
    "selfcare": ["frisor"],
    "food_and_drink": ["espresso", "starbucks", "peppes", "pizzabakeren"],
    "investing": ["nordnet"],
    "transport": ["ruter", "vy", "bolt", "yango"],
    "utilities": ["leie"]
}


def categorize(description):
    description = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in description for keyword in keywords):
            return category
    return "other"


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
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
        amount = -out if pd.notna(out) and out != "" else inc

        transactions.append({
            "date": row.get("dato"),
            "description": desc,
            "amount": round(amount, 2),
            "category": categorize(desc)
        })

    return {"transactions": transactions}


# Local test method (for quick dev testing)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("parser:app", host="127.0.0.1", port=8000, reload=True)

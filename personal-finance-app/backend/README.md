# Personal Finance Tracker - Backend

The backend service for the Personal Finance Tracker application, built with FastAPI.

## Setup

1. Install dependencies:
   pip install -r requirements.txt

2. Run the server:
   cd app python -m uvicorn main:app --reload

The API will be available at http://127.0.0.1:8000

## API Endpoints

- `POST /upload` - Upload a transaction file (.txt or .xlsx)

## File Format Requirements

The application expects transaction data with the following columns:

- "dato" - Date of transaction
- "forklaring" - Transaction description
- "ut fra konto" - Amount debited
- "inn på konto" - Amount credited

The system will automatically categorize transactions based on keywords in the description.

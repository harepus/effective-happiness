from datetime import datetime

def format_currency(amount: float, currency: str = "kr") -> str:
    """Format a currency amount with proper separator and currency symbol."""
    return f"{amount:,.2f} {currency}".replace(",", " ").replace(".", ",")

def parse_norwegian_date(date_str: str) -> datetime:
    """Parse a date string in Norwegian format (DD.MM.YYYY)."""
    return datetime.strptime(date_str, "%d.%m.%Y")
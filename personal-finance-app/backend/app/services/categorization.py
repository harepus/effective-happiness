# Keyword-based category mapping
CATEGORY_KEYWORDS = {
    # 🔽 Expenses
    "groceries": ["kiwi", "bunnpris", "rema", "coop", "meny", "matkroken", "hagkaup"],
    "subscriptions": ["spotify", "netflix", "viaplay", "youtube", "sats", "apple", "gjensidige", "google"],
    "clothing": ["zara", "h&m", "bikbok", "hm", "weekday", "monki"],
    "selfcare": ["frisør", "jasmin frisor", "hudpleie", "apotek", "spa"],
    "food_and_drink": ["espresso", "starbucks", "peppes", "pizzabakeren", "burger", "via napoli", "mc donalds", "kebab"],
    "transport": ["ruter", "vy", "bolt", "yango", "ruterappen", "flytoget"],
    "utilities": ["ice", "telenor", "telia", "leie", "strøm", "elinett", "husleie"],
    "entertainment": ["kino", "nordisk film kino", "colosseum", "event", "konsert"],
    "shopping": ["normal", "duty free", "wh smith", "tise", "vitusapotek", "nille", "clas ohlson", "jysk"],
    
    # 💸 Investments
    "investing": ["nordnet", "aksje", "fond", "etf", "sbanken invest"],
    
    # 🔼 Income
    "salary": ["lønn", "salary", "utbetaling", "fra arbeidsgiver", "arbeid"],
    "refunds": ["refusjon", "tilbakebetaling", "vipps fra", "vippsbetaling mottatt", "betaling fra"],
    
    # 🔄 Transfers (neutral, may or may not be saving)
    "transfers": ["overføring", "til konto", "fra konto", "egen konto", "dnb", "sparekonto"]
}

def categorize(description):
    description = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in description for keyword in keywords):
            return category
    return "other"
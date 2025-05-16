# Hierarchical category mapping
CATEGORY_HIERARCHY = {
    "expenses": {
        "daily_living": {
            "name": "Daily Living",
            "subcategories": {
                "groceries": {
                    "name": "Groceries",
                    "keywords": ["kiwi", "bunnpris", "rema", "coop", "meny", "matkroken", "hagkaup", "mega", "joker"]
                },
                "dining_out": {
                    "name": "Dining Out",
                    "keywords": ["espresso", "starbucks", "peppes", "pizzabakeren", "burger", "via napoli", "mc donalds", "kebab", "restaurant", "kafe"]
                }
            }
        },
        "housing": {
            "name": "Housing",
            "subcategories": {
                "rent": {
                    "name": "Rent",
                    "keywords": ["leie", "husleie", "bolig"]
                },
                "utilities": {
                    "name": "Utilities",
                    "keywords": ["strøm", "elinett", "electric", "vann", "water", "renovasjon", "avfall", "kommunale avgifter"]
                }
            }
        },
        "transportation": {
            "name": "Transportation",
            "subcategories": {
                "public_transport": {
                    "name": "Public Transport",
                    "keywords": ["ruter", "vy", "ruterappen", "flytoget", "t-bane", "buss", "trikk", "tog", "train", "bus", "tram"]
                },
                "taxis": {
                    "name": "Taxis & Rides",
                    "keywords": ["taxi", "bolt", "yango", "uber"]
                },
                "car": {
                    "name": "Car Expenses",
                    "keywords": ["bensin", "drivstoff", "fuel", "bomring", "toll", "parkering", "parking", "bilservice", "verksted"]
                }
            }
        },
        "shopping": {
            "name": "Shopping",
            "subcategories": {
                "clothing": {
                    "name": "Clothing",
                    "keywords": ["zara", "h&m", "bikbok", "hm", "weekday", "monki", "cubus", "dress", "klær"]
                },
                "electronics": {
                    "name": "Electronics",
                    "keywords": ["elkjøp", "power", "komplett", "kjell", "apple store", "samsung"]
                },
                "home_goods": {
                    "name": "Home Goods",
                    "keywords": ["ikea", "clas ohlson", "kid", "princess", "jysk", "nille", "jernia", "søstrene grene"]
                }
            }
        },
        "health": {
            "name": "Health",
            "subcategories": {
                "medical": {
                    "name": "Medical",
                    "keywords": ["lege", "legesenter", "doctor", "tannlege", "dentist", "fysioterapi", "kiropraktor", "apotek", "pharmacy", "vitusapotek"]
                },
                "selfcare": {
                    "name": "Self Care",
                    "keywords": ["frisør", "jasmin frisor", "hudpleie", "spa", "massage", "massasje", "salon", "salong"]
                },
                "fitness": {
                    "name": "Fitness",
                    "keywords": ["sats", "elixia", "treningssenter", "gym", "trening"]
                }
            }
        },
        "entertainment": {
            "name": "Entertainment",
            "subcategories": {
                "streaming": {
                    "name": "Streaming Services",
                    "keywords": ["spotify", "netflix", "viaplay", "youtube", "hbo", "disney+", "amazon prime"]
                },
                "events": {
                    "name": "Events & Tickets",
                    "keywords": ["kino", "nordisk film kino", "colosseum", "event", "konsert", "concert", "teater", "theater", "billetter", "tickets"]
                },
                "hobbies": {
                    "name": "Hobbies",
                    "keywords": ["bøker", "books", "ark", "norli", "spill", "games", "hobby"]
                }
            }
        },
        "travel": {
            "name": "Travel",
            "subcategories": {
                "flights": {
                    "name": "Flights",
                    "keywords": ["sas", "norwegian", "widerøe", "ryanair", "lufthansa", "klm", "flight", "fly"]
                },
                "hotels": {
                    "name": "Hotels",
                    "keywords": ["hotel", "hotell", "airbnb", "booking.com", "hotels.com", "expedia", "overnatting"]
                },
                "vacation": {
                    "name": "Vacation Activities",
                    "keywords": ["tour", "tur", "opplevelse", "experience", "sightseeing"]
                }
            }
        },
        "subscriptions": {
            "name": "Subscriptions & Services",
            "subcategories": {
                "telecom": {
                    "name": "Telecom",
                    "keywords": ["ice", "telenor", "telia", "mobilabonnement", "phone", "internet", "mobil"]
                },
                "software": {
                    "name": "Software & Apps",
                    "keywords": ["google", "apple.com/bill", "microsoft", "app store", "play store", "adobe", "icloud"]
                },
                "insurance": {
                    "name": "Insurance",
                    "keywords": ["gjensidige", "if", "tryg", "fremtind", "forsikring", "insurance"]
                }
            }
        }
    },
    "income": {
        "earnings": {
            "name": "Earnings",
            "subcategories": {
                "salary": {
                    "name": "Salary",
                    "keywords": ["lønn", "salary", "utbetaling", "fra arbeidsgiver", "arbeid", "universitetet", "studentsamskipnaden", "sio"]
                },
                "benefits": {
                    "name": "Benefits & Support",
                    "keywords": ["nav", "stipend", "stønad", "lånekassen", "scholarship", "lånekasse", "statens lånekasse"]
                }
            }
        },
        "other_income": {
            "name": "Other Income",
            "subcategories": {
                "refunds": {
                    "name": "Refunds",
                    "keywords": ["refusjon", "tilbakebetaling", "refund", "return"]
                },
                "gifts": {
                    "name": "Gifts",
                    "keywords": ["gave", "gift", "vipps fra", "vippsbetaling mottatt", "betaling fra"]
                },
                "investments": {
                    "name": "Investment Returns",
                    "keywords": ["utbytte", "dividend", "rente", "interest", "avkastning", "return"]
                }
            }
        }
    },
    "transfers": {
        "name": "Transfers",
        "keywords": ["overføring", "til konto", "fra konto", "egen konto", "dnb", "sparekonto", "transfer"]
    },
    "investments": {
        "name": "Investments",
        "keywords": ["nordnet", "aksje", "fond", "etf", "sbanken invest", "stock", "fund"]
    }
}

# Keep the flat category keywords for backward compatibility
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
    "salary": ["lønn", "salary", "utbetaling", "fra arbeidsgiver", "arbeid", "universitetet", "studentsamskipnaden", "sio"],
    "refunds": ["refusjon", "tilbakebetaling", "vipps fra", "vippsbetaling mottatt", "betaling fra"],
    "benefits": ["nav", "stipend", "stønad", "lånekassen", "scholarship", "lånekasse", "statens lånekasse"],
    
    # 🔄 Transfers (neutral, may or may not be saving)
    "transfers": ["overføring", "til konto", "fra konto", "egen konto", "dnb", "sparekonto"]
}

def categorize(description, use_hierarchy=False):
    """
    Categorize a transaction based on keywords in the description.
    
    Args:
        description (str): Transaction description
        use_hierarchy (bool): Whether to use hierarchical categories
        
    Returns:
        str: Category name or category hierarchy path
    """
    description = description.lower()
    
    if use_hierarchy:
        # Use hierarchical categorization
        result = {"main_category": "", "category": "", "subcategory": ""}
        
        # Check if it's a transfer or investment first (these are top-level)
        for special_cat in ["transfers", "investments"]:
            if any(keyword in description for keyword in CATEGORY_HIERARCHY[special_cat]["keywords"]):
                return special_cat
        
        # Check hierarchical categories
        for main_cat, main_data in CATEGORY_HIERARCHY.items():
            if main_cat in ["transfers", "investments"]:
                continue  # Already checked these
                
            for category, cat_data in main_data.items():
                for subcat, subcat_data in cat_data["subcategories"].items():
                    keywords = subcat_data["keywords"]
                    if any(keyword in description for keyword in keywords):
                        return {
                            "main_category": main_cat,
                            "category": category,
                            "subcategory": subcat,
                            "display_name": subcat_data["name"]
                        }
        
        # If no specific match found
        return "other"
    else:
        # Legacy flat categorization
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in description for keyword in keywords):
                return category
        return "other"
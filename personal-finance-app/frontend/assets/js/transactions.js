/**
 * Utility functions for working with transaction data
 */

// Category mapping for client-side categorization
const CATEGORY_KEYWORDS = {
  // 🔽 Expenses
  groceries: [
    "kiwi",
    "bunnpris",
    "rema",
    "coop",
    "meny",
    "matkroken",
    "hagkaup",
    "mega",
    "joker",
  ],
  dining_out: [
    "espresso",
    "starbucks",
    "peppes",
    "pizzabakeren",
    "burger",
    "via napoli",
    "mc donalds",
    "kebab",
    "restaurant",
    "kafe",
  ],
  rent: ["leie", "husleie", "bolig"],
  utilities: [
    "strøm",
    "elinett",
    "electric",
    "vann",
    "water",
    "renovasjon",
    "avfall",
    "kommunale avgifter",
  ],
  public_transport: [
    "ruter",
    "vy",
    "ruterappen",
    "flytoget",
    "t-bane",
    "buss",
    "trikk",
    "tog",
    "train",
    "bus",
    "tram",
  ],
  taxis: ["taxi", "bolt", "yango", "uber"],
  car: [
    "bensin",
    "drivstoff",
    "fuel",
    "bomring",
    "toll",
    "parkering",
    "parking",
    "bilservice",
    "verksted",
  ],
  clothing: [
    "zara",
    "h&m",
    "bikbok",
    "hm",
    "weekday",
    "monki",
    "cubus",
    "dress",
    "klær",
  ],
  electronics: [
    "elkjøp",
    "power",
    "komplett",
    "kjell",
    "apple store",
    "samsung",
  ],
  home_goods: [
    "ikea",
    "clas ohlson",
    "kid",
    "princess",
    "jysk",
    "nille",
    "jernia",
    "søstrene grene",
  ],
  medical: [
    "lege",
    "legesenter",
    "doctor",
    "tannlege",
    "dentist",
    "fysioterapi",
    "kiropraktor",
    "apotek",
    "pharmacy",
    "vitusapotek",
  ],
  selfcare: [
    "frisør",
    "jasmin frisor",
    "hudpleie",
    "spa",
    "massage",
    "massasje",
    "salon",
    "salong",
  ],
  fitness: ["sats", "elixia", "treningssenter", "gym", "trening"],
  streaming: [
    "spotify",
    "netflix",
    "viaplay",
    "youtube",
    "hbo",
    "disney+",
    "amazon prime",
  ],
  events: [
    "kino",
    "nordisk film kino",
    "colosseum",
    "event",
    "konsert",
    "concert",
    "teater",
    "theater",
    "billetter",
    "tickets",
  ],
  hobbies: ["bøker", "books", "ark", "norli", "spill", "games", "hobby"],
  flights: [
    "sas",
    "norwegian",
    "widerøe",
    "ryanair",
    "lufthansa",
    "klm",
    "flight",
    "fly",
  ],
  hotels: [
    "hotel",
    "hotell",
    "airbnb",
    "booking.com",
    "hotels.com",
    "expedia",
    "overnatting",
  ],
  vacation: ["tour", "tur", "opplevelse", "experience", "sightseeing"],
  telecom: [
    "ice",
    "telenor",
    "telia",
    "mobilabonnement",
    "phone",
    "internet",
    "mobil",
  ],
  software: [
    "google",
    "apple.com/bill",
    "microsoft",
    "app store",
    "play store",
    "adobe",
    "icloud",
  ],
  insurance: [
    "gjensidige",
    "if",
    "tryg",
    "fremtind",
    "forsikring",
    "insurance",
  ],

  // 🔼 Income
  salary: ["lønn", "salary", "utbetaling", "fra arbeidsgiver", "arbeid"],
  benefits: ["nav", "stipend", "stønad", "lånekassen", "scholarship"],
  refunds: ["refusjon", "tilbakebetaling", "refund", "return"],
  gifts: ["gave", "gift", "vipps fra", "vippsbetaling mottatt", "betaling fra"],
  investment_returns: [
    "utbytte",
    "dividend",
    "rente",
    "interest",
    "avkastning",
    "return",
  ],

  // 🔄 Transfers and investments
  transfers: [
    "overføring",
    "til konto",
    "fra konto",
    "egen konto",
    "dnb",
    "sparekonto",
    "transfer",
  ],
  investments: [
    "nordnet",
    "aksje",
    "fond",
    "etf",
    "sbanken invest",
    "stock",
    "fund",
  ],
};

// Main categories mapping
const CATEGORY_HIERARCHY = {
  daily_living: ["groceries", "dining_out"],
  housing: ["rent", "utilities"],
  transportation: ["public_transport", "taxis", "car"],
  shopping: ["clothing", "electronics", "home_goods"],
  health: ["medical", "selfcare", "fitness"],
  entertainment: ["streaming", "events", "hobbies"],
  travel: ["flights", "hotels", "vacation"],
  subscriptions: ["telecom", "software", "insurance"],
};

// Function to categorize a transaction based on its description
function categorizeTransaction(description) {
  description = description.toLowerCase();

  // Check if it's a transfer
  for (const keyword of CATEGORY_KEYWORDS.transfers) {
    if (description.includes(keyword.toLowerCase())) {
      return {
        mainCategory: "transfers",
        category: "transfers",
        subcategory: "transfers",
      };
    }
  }

  // Check if it's an investment
  for (const keyword of CATEGORY_KEYWORDS.investments) {
    if (description.includes(keyword.toLowerCase())) {
      return {
        mainCategory: "investments",
        category: "investments",
        subcategory: "investments",
      };
    }
  }

  // Check if it's income
  for (const subcategory of [
    "salary",
    "benefits",
    "refunds",
    "gifts",
    "investment_returns",
  ]) {
    for (const keyword of CATEGORY_KEYWORDS[subcategory] || []) {
      if (description.includes(keyword.toLowerCase())) {
        return {
          mainCategory: "income",
          category:
            subcategory === "investment_returns"
              ? "other_income"
              : subcategory === "benefits"
              ? "other_income"
              : "earnings",
          subcategory: subcategory,
        };
      }
    }
  }

  // Check expense categories
  for (const subcategory in CATEGORY_KEYWORDS) {
    // Skip non-expense categories
    if (
      [
        "transfers",
        "investments",
        "salary",
        "benefits",
        "refunds",
        "gifts",
        "investment_returns",
      ].includes(subcategory)
    ) {
      continue;
    }

    for (const keyword of CATEGORY_KEYWORDS[subcategory]) {
      if (description.includes(keyword.toLowerCase())) {
        // Find the parent category
        let parentCategory = "";
        for (const parent in CATEGORY_HIERARCHY) {
          if (CATEGORY_HIERARCHY[parent].includes(subcategory)) {
            parentCategory = parent;
            break;
          }
        }

        return {
          mainCategory: "expenses",
          category: parentCategory,
          subcategory: subcategory,
        };
      }
    }
  }

  // Default category for unmatched transactions
  return {
    mainCategory: "expenses",
    category: "other",
    subcategory: "uncategorized",
  };
}

// Function to format categories for display
function formatCategoryName(category) {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to parse a transaction from common bank formats
function parseTransaction(row) {
  // Default structure with required fields
  const transaction = {
    date: "",
    description: "",
    amount: 0,
    isExpense: false,
    category: {
      mainCategory: "expenses",
      category: "other",
      subcategory: "uncategorized",
    },
  };

  // Try to extract date (expected in field 0)
  if (row[0]) {
    // Try to parse various date formats
    const dateStr = row[0].toString().trim();
    try {
      // Handle common date formats
      if (dateStr.includes(".")) {
        // DD.MM.YYYY format
        const [day, month, year] = dateStr.split(".");
        transaction.date = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      } else if (dateStr.includes("/")) {
        // DD/MM/YYYY format
        const [day, month, year] = dateStr.split("/");
        transaction.date = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      } else if (dateStr.includes("-")) {
        // YYYY-MM-DD format (already correct)
        transaction.date = dateStr;
      } else {
        // Default to today if we can't parse
        const today = new Date();
        transaction.date = today.toISOString().split("T")[0];
      }
    } catch (e) {
      console.error("Error parsing date:", e);
      // Default to today
      const today = new Date();
      transaction.date = today.toISOString().split("T")[0];
    }
  }

  // Try to extract description (expected in field 1)
  if (row[1]) {
    transaction.description = row[1].toString().trim();
  }

  // Try to determine amount and whether it's an expense
  // Common formats have outgoing in field 3 and incoming in field 4
  if (row[3] && parseFloat(row[3]) > 0) {
    // Outgoing amount (expense)
    transaction.amount = -Math.abs(parseFloat(row[3]));
    transaction.isExpense = true;
  } else if (row[4] && parseFloat(row[4]) > 0) {
    // Incoming amount (income)
    transaction.amount = Math.abs(parseFloat(row[4]));
    transaction.isExpense = false;
  } else if (row[2] && parseFloat(row[2])) {
    // Single amount field - negative is expense, positive is income
    transaction.amount = parseFloat(row[2]);
    transaction.isExpense = transaction.amount < 0;
  }

  // Categorize the transaction based on description
  transaction.category = categorizeTransaction(transaction.description);

  return transaction;
}

// Function to parse a CSV file (semicolon or comma separated)
function parseCSV(text, delimiter = ";") {
  // First try with the provided delimiter
  let rows = text.split("\n").map((row) => row.split(delimiter));

  // If we don't get meaningful rows with semicolon, try comma
  if (rows.length <= 1 || rows[0].length <= 1) {
    rows = text.split("\n").map((row) => row.split(","));
  }

  // Get header row and data rows
  const header = rows[0];
  const dataRows = rows
    .slice(1)
    .filter((row) => row.length >= Math.min(4, header.length));

  // Parse each row into a transaction
  return dataRows.map((row) => parseTransaction(row));
}

// Function to calculate statistics from transactions
function calculateStatistics(transactions) {
  const stats = {
    expenses: {
      total: 0,
      categories: {},
      subcategories: {},
    },
    income: {
      total: 0,
      categories: {},
      subcategories: {},
    },
    daily_expenses: {},
    monthly_summary: {},
    transfers: 0,
    investments: 0,
  };

  transactions.forEach((transaction) => {
    const amount = Math.abs(transaction.amount);
    const { mainCategory, category, subcategory } = transaction.category;

    // Skip zero-amount transactions
    if (amount === 0) return;

    // Update based on main category
    if (mainCategory === "expenses") {
      stats.expenses.total += amount;

      // Update category total
      stats.expenses.categories[category] =
        (stats.expenses.categories[category] || 0) + amount;

      // Update subcategory total
      stats.expenses.subcategories[subcategory] =
        (stats.expenses.subcategories[subcategory] || 0) + amount;

      // Update daily expenses
      if (transaction.date) {
        stats.daily_expenses[transaction.date] =
          (stats.daily_expenses[transaction.date] || 0) + amount;
      }

      // Update monthly summary
      if (transaction.date) {
        const monthYear = transaction.date.substring(0, 7); // YYYY-MM
        if (!stats.monthly_summary[monthYear]) {
          stats.monthly_summary[monthYear] = { expenses: 0, income: 0 };
        }
        stats.monthly_summary[monthYear].expenses += amount;
      }
    } else if (mainCategory === "income") {
      stats.income.total += amount;

      // Update category total
      stats.income.categories[category] =
        (stats.income.categories[category] || 0) + amount;

      // Update subcategory total
      stats.income.subcategories[subcategory] =
        (stats.income.subcategories[subcategory] || 0) + amount;

      // Update monthly summary
      if (transaction.date) {
        const monthYear = transaction.date.substring(0, 7); // YYYY-MM
        if (!stats.monthly_summary[monthYear]) {
          stats.monthly_summary[monthYear] = { expenses: 0, income: 0 };
        }
        stats.monthly_summary[monthYear].income += amount;
      }
    } else if (mainCategory === "transfers") {
      stats.transfers += amount;
    } else if (mainCategory === "investments") {
      stats.investments += amount;
    }
  });

  return stats;
}

// Export functions
export {
  categorizeTransaction,
  parseTransaction,
  parseCSV,
  calculateStatistics,
  formatCategoryName,
  CATEGORY_KEYWORDS,
  CATEGORY_HIERARCHY,
};

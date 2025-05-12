// Global variables
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000" // Local development
    : ""; // Production (same domain)

let pieChart, barChart, lineChart;

// Document ready function
document.addEventListener("DOMContentLoaded", function () {
  console.log("Personal Finance Tracker initialized");

  // Initialize file upload
  initFileUpload();

  // Initialize Trumf integration
  initTrumfIntegration();
});

// File Upload and Processing
function initFileUpload() {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");

  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files[0]) {
      alert("Please select a file first");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // Show loading state
    uploadBtn.textContent = "Uploading...";
    uploadBtn.disabled = true;

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("File upload successful:", data);

      // Process and display transaction data
      if (data.transactions) {
        renderDashboard(data.transactions);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      const output = document.getElementById("output");
      if (output) {
        output.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      // Reset upload button
      uploadBtn.textContent = "Upload File";
      uploadBtn.disabled = false;
    }
  });
}

// Process transaction data and render charts
function renderDashboard(transactions) {
  // Process data for charts
  const categoryData = processCategoryData(transactions);
  const dailyData = processDailyData(transactions);
  const monthlyData = processMonthlyData(transactions);

  // Render charts
  renderPieChart(categoryData);
  renderBarChart(dailyData);
  renderLineChart(monthlyData);

  // Display summary in output section
  displaySummary(categoryData, monthlyData);
}

function processCategoryData(transactions) {
  // Group transactions by category
  const categories = {};

  transactions.forEach((transaction) => {
    const category = transaction.category || "Uncategorized";
    const amount = parseFloat(transaction.amount);

    if (amount < 0) {
      // Only count expenses (negative amounts)
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += Math.abs(amount);
    }
  });

  return categories;
}

function processDailyData(transactions) {
  // Group expenses by day of week
  const days = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };

  transactions.forEach((transaction) => {
    if (transaction.date && transaction.amount < 0) {
      const date = new Date(transaction.date);
      const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        date.getDay()
      ];
      days[dayOfWeek] += Math.abs(parseFloat(transaction.amount));
    }
  });

  return days;
}

function processMonthlyData(transactions) {
  // Group income and expenses by month
  const months = {};

  transactions.forEach((transaction) => {
    if (transaction.date) {
      const date = new Date(transaction.date);
      const month = date.toLocaleString("default", { month: "short" });

      if (!months[month]) {
        months[month] = { income: 0, expenses: 0 };
      }

      const amount = parseFloat(transaction.amount);
      if (amount > 0) {
        months[month].income += amount;
      } else {
        months[month].expenses += Math.abs(amount);
      }
    }
  });

  // Sort months chronologically
  const sortedMonths = {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  monthNames.forEach((month) => {
    if (months[month]) {
      sortedMonths[month] = months[month];
    }
  });

  return sortedMonths;
}

function renderPieChart(categoryData) {
  const ctx = document.getElementById("pieChart")?.getContext("2d");
  if (!ctx) return;

  if (pieChart) {
    pieChart.destroy();
  }

  // Sort categories by amount (descending)
  const sortedCategories = Object.keys(categoryData)
    .map((category) => ({ category, amount: categoryData[category] }))
    .sort((a, b) => b.amount - a.amount);

  const labels = sortedCategories.map((item) => item.category);
  const data = sortedCategories.map((item) => item.amount);

  // Generate colors
  const backgroundColors = generateColors(labels.length);

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              return `${context.label}: ${value.toFixed(2)} kr`;
            },
          },
        },
      },
    },
  });
}

function renderBarChart(dailyData) {
  const ctx = document.getElementById("barChart")?.getContext("2d");
  if (!ctx) return;

  if (barChart) {
    barChart.destroy();
  }

  // Order days correctly (Monday first)
  const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const labels = orderedDays;
  const data = orderedDays.map((day) => dailyData[day]);

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses",
          data: data,
          backgroundColor: "rgba(74, 110, 181, 0.7)",
          borderColor: "rgba(74, 110, 181, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.raw.toFixed(2)} kr`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + " kr";
            },
          },
        },
      },
    },
  });
}

function renderLineChart(monthlyData) {
  const ctx = document.getElementById("lineChart")?.getContext("2d");
  if (!ctx) return;

  if (lineChart) {
    lineChart.destroy();
  }

  const labels = Object.keys(monthlyData);
  const incomeData = labels.map((month) => monthlyData[month].income);
  const expenseData = labels.map((month) => monthlyData[month].expenses);

  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          borderColor: "rgba(46, 204, 113, 1)",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Expenses",
          data: expenseData,
          borderColor: "rgba(231, 76, 60, 1)",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              return `${context.dataset.label}: ${value.toFixed(2)} kr`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + " kr";
            },
          },
        },
      },
    },
  });
}

function displaySummary(categoryData, monthlyData) {
  const outputEl = document.getElementById("output");
  if (!outputEl) return;

  // Calculate total income & expenses
  let totalIncome = 0;
  let totalExpenses = 0;

  Object.values(monthlyData).forEach((month) => {
    totalIncome += month.income;
    totalExpenses += month.expenses;
  });

  const savings = totalIncome - totalExpenses;
  const savingsPercentage = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Top spending categories
  const topCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let categoryHtml = "";
  topCategories.forEach(([category, amount]) => {
    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
    categoryHtml += `
      <div class="summary-item">
        <span class="category-name">${category}</span>
        <span class="category-amount">${amount.toFixed(
          2
        )} kr (${percentage}%)</span>
      </div>
    `;
  });

  outputEl.innerHTML = `
    <h3>Financial Summary</h3>
    
    <div class="summary-section">
      <div class="summary-row">
        <div class="summary-box income">
          <h4>Total Income</h4>
          <div class="amount">${totalIncome.toFixed(2)} kr</div>
        </div>
        
        <div class="summary-box expenses">
          <h4>Total Expenses</h4>
          <div class="amount">${totalExpenses.toFixed(2)} kr</div>
        </div>
        
        <div class="summary-box savings ${
          savings >= 0 ? "positive" : "negative"
        }">
          <h4>Savings</h4>
          <div class="amount">${savings.toFixed(2)} kr</div>
          <div class="percentage">${savingsPercentage.toFixed(
            1
          )}% of income</div>
        </div>
      </div>
    </div>
    
    <div class="top-categories">
      <h4>Top Spending Categories</h4>
      ${categoryHtml}
    </div>
  `;

  // Add styles for summary
  const style = document.createElement("style");
  style.textContent = `
    .summary-section {
      margin: 20px 0;
    }
    
    .summary-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .summary-box {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      border-radius: 8px;
      background-color: #f9f9f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .summary-box h4 {
      margin-bottom: 10px;
      font-size: 1rem;
      color: #555;
    }
    
    .summary-box .amount {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .summary-box .percentage {
      font-size: 0.9rem;
      color: #777;
      margin-top: 5px;
    }
    
    .summary-box.income {
      background-color: #e8f5e9;
    }
    
    .summary-box.expenses {
      background-color: #ffebee;
    }
    
    .summary-box.savings.positive {
      background-color: #e0f2f1;
    }
    
    .summary-box.savings.negative {
      background-color: #fbe9e7;
    }
    
    .top-categories {
      margin-top: 20px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .category-name {
      font-weight: 500;
    }
    
    .category-amount {
      color: #555;
    }
  `;

  document.head.appendChild(style);
}

// Trumf Integration
function initTrumfIntegration() {
  const trumfTokenInput = document.getElementById("trumfTokenInput");
  const fetchTrumfBtn = document.getElementById("fetchTrumfBtn");
  const debugTrumfBtn = document.getElementById("debugTrumfBtn");
  const trumfOutput = document.getElementById("trumfOutput");

  if (!trumfTokenInput || !fetchTrumfBtn || !trumfOutput) return;

  // Load token from localStorage if available
  const savedToken = localStorage.getItem("trumfToken");
  if (savedToken) {
    trumfTokenInput.value = savedToken;
  }

  // Import Trumf data
  fetchTrumfBtn.addEventListener("click", async () => {
    const token = trumfTokenInput.value.trim();

    if (!token) {
      alert("Please enter your Trumf token first");
      return;
    }

    // Save token to localStorage
    localStorage.setItem("trumfToken", token);

    // Show loading state
    trumfOutput.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>Loading your Trumf data...</span>
      </div>
    `;

    try {
      const transactionsResult = await fetchTrumfTransactions(token);

      if (transactionsResult.error) {
        throw new Error(transactionsResult.error);
      }

      if (
        !transactionsResult.transactions ||
        !transactionsResult.transactions.length
      ) {
        throw new Error("No transactions found");
      }

      // Display transactions
      let html = "<h3>Your Recent Trumf Receipts</h3>";
      html += '<div class="receipts-container">';

      // Get first 10 transactions
      const transactions = transactionsResult.transactions.slice(0, 10);

      for (const transaction of transactions) {
        const store = transaction.beskrivelse1 || "Unknown Store";
        const date = transaction.transaksjonsTidspunkt
          ? new Date(transaction.transaksjonsTidspunkt).toLocaleDateString()
          : "Invalid Date";
        const amount = parseFloat(transaction.belop || 0);

        html += `
          <div class="receipt-card">
            <div class="receipt-header">
              <div class="store-info">
                <span class="store-name">${store}</span>
                <span class="transaction-date">${date}</span>
              </div>
              <span class="transaction-amount">${amount.toFixed(2)} kr</span>
            </div>
            <div class="receipt-body" id="receipt-${
              transaction.batchId || "unknown"
            }">
              <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading details...</span>
              </div>
            </div>
          </div>
        `;
      }

      html += "</div>";
      trumfOutput.innerHTML = html;

      // Fetch details for each receipt
      for (const transaction of transactions) {
        if (!transaction.batchId) continue;

        const receiptContainer = document.getElementById(
          `receipt-${transaction.batchId}`
        );
        if (!receiptContainer) continue;

        const receiptData = await fetchTrumfReceipt(token, transaction.batchId);
        displayTrumfReceipt(receiptData, receiptContainer);
      }
    } catch (error) {
      console.error("Error fetching Trumf data:", error);
      trumfOutput.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
  });

  // Debug Trumf API
  if (debugTrumfBtn) {
    debugTrumfBtn.addEventListener("click", async () => {
      const token = trumfTokenInput.value.trim();

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("trumfToken", token);

      // Show loading state
      trumfOutput.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>Debugging Trumf API...</span>
        </div>
      `;

      try {
        const transactionsResult = await fetchTrumfTransactions(token);

        if (transactionsResult.error) {
          throw new Error(transactionsResult.error);
        }

        if (
          !transactionsResult.transactions ||
          !transactionsResult.transactions.length
        ) {
          throw new Error("No transactions found");
        }

        // Show transactions for debugging
        let html = "<h3>Debug - Trumf Transactions</h3>";
        html += "<p>Click on a transaction to debug its receipt data</p>";

        html += '<div class="debug-transactions">';

        // Get first 20 transactions for debugging
        const transactions = transactionsResult.transactions.slice(0, 20);

        for (const transaction of transactions) {
          const store = transaction.beskrivelse1 || "Unknown Store";
          const date = transaction.transaksjonsTidspunkt
            ? new Date(transaction.transaksjonsTidspunkt).toLocaleDateString()
            : "Invalid Date";
          const amount = parseFloat(transaction.belop || 0);

          html += `
            <div class="debug-transaction-item" data-batch-id="${
              transaction.batchId || ""
            }">
              <div class="debug-transaction-info">
                <span class="store-name">${store}</span>
                <span class="transaction-date">${date}</span>
                <span class="transaction-amount">${amount.toFixed(2)} kr</span>
              </div>
              <button class="debug-btn" data-batch-id="${
                transaction.batchId || ""
              }">Debug Receipt</button>
            </div>
          `;
        }

        html += "</div>";
        html += '<div id="debug-output"></div>';

        trumfOutput.innerHTML = html;

        // Attach debug buttons event listeners
        document.querySelectorAll(".debug-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const batchId = e.target.dataset.batchId;
            if (!batchId) return;

            const debugOutput = document.getElementById("debug-output");
            debugOutput.innerHTML = `
              <div class="loading">
                <div class="loading-spinner"></div>
                <span>Debugging receipt ${batchId}...</span>
              </div>
            `;

            try {
              // Use direct-debug endpoint for detailed info
              const debugData = await fetch(
                `${API_URL}/trumf/direct-debug/${batchId}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              ).then((res) => res.json());

              // Display debug info
              let debugHtml = `
                <h4>Debug Information for Receipt ${batchId}</h4>
                <div class="debug-status">Status: ${
                  debugData.statusCode === 200 ? "✅ Success" : "❌ Failed"
                }</div>
              `;

              if (
                debugData.processedItems &&
                debugData.processedItems.length > 0
              ) {
                debugHtml += `
                  <h5>Processed Items (${debugData.processedItems.length})</h5>
                  <table class="receipt-items-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th class="price-cell">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                `;

                debugData.processedItems.forEach((item) => {
                  debugHtml += `
                    <tr>
                      <td class="item-name">${item.name}</td>
                      <td>${item.quantity}</td>
                      <td class="price-cell">${parseFloat(item.price).toFixed(
                        2
                      )} kr</td>
                    </tr>
                  `;
                });

                debugHtml += `
                    </tbody>
                  </table>
                `;
              }

              // Add raw receipt data structure
              debugHtml += `
                <h5>Response Structure</h5>
                <pre class="debug-json-structure">${formatJsonStructure(
                  debugData.receipt
                )}</pre>
                
                <details>
                  <summary>Raw Data</summary>
                  <pre class="debug-json">${JSON.stringify(
                    debugData.receipt,
                    null,
                    2
                  )}</pre>
                </details>
              `;

              debugOutput.innerHTML = debugHtml;

              // Scroll to debug output
              debugOutput.scrollIntoView({ behavior: "smooth" });
            } catch (error) {
              console.error("Debug error:", error);
              debugOutput.innerHTML = `<div class="error-message">Debug failed: ${error.message}</div>`;
            }
          });
        });
      } catch (error) {
        console.error("Error debugging Trumf API:", error);
        trumfOutput.innerHTML = `<div class="error-message">${error.message}</div>`;
      }
    });
  }
}

// Helper function to format JSON structure for display
function formatJsonStructure(obj, level = 0) {
  if (!obj) return "null";

  const indent = "  ".repeat(level);
  const indentInner = "  ".repeat(level + 1);

  if (Array.isArray(obj)) {
    const sample = obj.length > 0 ? typeof obj[0] : "empty";
    return `{
  "type": "array",
  "length": ${obj.length},
  "sample": "${sample}"
}`;
  } else if (typeof obj === "object") {
    let result = "{\n";
    for (const [key, value] of Object.entries(obj)) {
      result += `${indentInner}"${key}": `;

      if (Array.isArray(value)) {
        result += `{
${indentInner}  "type": "array",
${indentInner}  "length": ${value.length},
${indentInner}  "sample": "${value.length > 0 ? typeof value[0] : "empty"}"
${indentInner}}`;
      } else if (typeof value === "object" && value !== null) {
        result += '{ "type": "object" }';
      } else {
        result += `{
${indentInner}  "type": "${typeof value}",
${indentInner}  "value": ${JSON.stringify(value)}
${indentInner}}`;
      }

      result += ",\n";
    }
    if (result.endsWith(",\n")) {
      result = result.slice(0, -2) + "\n";
    }
    result += indent + "}";
    return result;
  } else {
    return JSON.stringify(obj);
  }
}

// Trumf API functions
async function fetchTrumfTransactions(token) {
  try {
    const response = await fetch(`${API_URL}/trumf/transactions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error fetching Trumf transactions:", error);
    return { error: error.message };
  }
}

async function fetchTrumfReceipt(token, batchId) {
  try {
    const response = await fetch(`${API_URL}/trumf/receipts/${batchId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching receipt ${batchId}:`, error);
    return { error: error.message };
  }
}

function displayTrumfReceipt(receiptData, container) {
  if (!receiptData || receiptData.error) {
    container.innerHTML = `<div class="error-message">${
      receiptData.error || "Failed to load receipt"
    }</div>`;
    return;
  }

  const receipt = receiptData.receipt;
  if (!receipt) {
    container.innerHTML =
      "<div class='error-message'>No receipt data found</div>";
    return;
  }

  const items = receipt.processed_items || [];
  if (items.length === 0) {
    container.innerHTML =
      "<p class='info-message'>No items found in this receipt.</p>";
    return;
  }

  let html = `
    <table class="receipt-items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th class="price-cell">Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item) => {
    html += `
      <tr>
        <td class="item-name">${item.name}</td>
        <td>${item.quantity}</td>
        <td class="price-cell">${parseFloat(item.price).toFixed(2)} kr</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// Utility functions
function generateColors(count) {
  const baseColors = [
    "rgba(74, 110, 181, 0.8)", // Primary
    "rgba(125, 149, 201, 0.8)", // Secondary
    "rgba(230, 126, 34, 0.8)", // Accent
    "rgba(52, 152, 219, 0.8)", // Blue
    "rgba(46, 204, 113, 0.8)", // Green
    "rgba(155, 89, 182, 0.8)", // Purple
    "rgba(231, 76, 60, 0.8)", // Red
    "rgba(241, 196, 15, 0.8)", // Yellow
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}

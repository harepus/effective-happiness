document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const outputDiv = document.getElementById("output");
  const trumfTokenInput = document.getElementById("trumfTokenInput");
  const fetchTrumfBtn = document.getElementById("fetchTrumfBtn");
  const trumfOutput = document.getElementById("trumfOutput");
  const trumfHowToGet = document.getElementById("trumfHowToGet");
  const trumfButton = document.getElementById("fetchTrumfBtn");

  let pieChart, barChart, lineChart;

  // Load saved Trumf token if available
  if (trumfTokenInput) {
    const savedToken = localStorage.getItem("trumfToken");
    if (savedToken) {
      trumfTokenInput.value = savedToken;
      trumfOutput.innerHTML = `<p class="saved-token-info">✓ Token loaded from your previous session</p>`;
    }
  }

  // Add instructions for getting Trumf token
  if (trumfHowToGet) {
    trumfHowToGet.innerHTML = `
      <details>
        <summary>How to get your Trumf token</summary>
        <ol>
          <li>Go to <a href="https://www.trumf.no" target="_blank">Trumf.no</a> and log in</li>
          <li>Go to the <a href="https://www.trumf.no/historikk" target="_blank">receipts page</a></li>
          <li>Click on one of the receipt icons in the list</li>
          <li>If you see a popup asking to confirm your password, click "Bekreft passord"</li>
          <li>Enter your password (and SMS code if required)</li>
          <li>You'll be redirected back to the history page</li>
          <li>Open Developer Tools (F12 on Windows, Option + CMD + J on Mac)</li>
          <li>Go to the "Console" tab</li>
          <li>Copy and paste this code into the console and press Enter:</li>
          <li><code>copy(window._siteGlobalSettings.userToken)</code></li>
          <li>The token is now in your clipboard - paste it in the field above</li>
        </ol>
      </details>
    `;
  }

  // 1. Transaction Upload functionality
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Please select a file first");
        return;
      }

      outputDiv.textContent = "Uploading and processing file...";

      const result = await uploadTransactionFile(file);

      if (result.error) {
        outputDiv.textContent = `Error: ${result.error}`;
        return;
      }

      if (!result.transactions || result.transactions.length === 0) {
        outputDiv.textContent = "No transactions found in the file";
        return;
      }

      processTransactions(result.transactions);
    });
  }

  function processTransactions(transactions) {
    // Process category data for pie chart
    const categorySums = {};
    const daySums = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
    const monthlyData = {};

    // Separate income and expenses
    const expenses = transactions.filter((t) => t.amount < 0);
    const income = transactions.filter((t) => t.amount > 0);

    // Calculate category totals for expenses
    expenses.forEach((tx) => {
      const amount = Math.abs(tx.amount);
      categorySums[tx.category] = (categorySums[tx.category] || 0) + amount;

      const date = new Date(tx.date);
      if (!isNaN(date.getTime())) {
        // Check if date is valid
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        daySums[weekday] += amount;

        // Monthly tracking
        const monthYear = date.toISOString().substring(0, 7); // YYYY-MM format
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expenses: 0 };
        }
        monthlyData[monthYear].expenses += amount;
      }
    });

    // Calculate monthly income
    income.forEach((tx) => {
      const date = new Date(tx.date);
      if (!isNaN(date.getTime())) {
        // Check if date is valid
        const monthYear = date.toISOString().substring(0, 7);
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { income: 0, expenses: 0 };
        }
        monthlyData[monthYear].income += tx.amount;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeData = {};
    const expenseData = {};

    sortedMonths.forEach((month) => {
      incomeData[month] = monthlyData[month].income;
      expenseData[month] = monthlyData[month].expenses;
    });

    // Create or update charts
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    if (lineChart) lineChart.destroy();

    pieChart = createPieChart("pieChart", categorySums);
    barChart = createBarChart("barChart", daySums);
    lineChart = createLineChart("lineChart", incomeData, expenseData);

    // Show summary
    const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = Math.abs(
      expenses.reduce((sum, tx) => sum + tx.amount, 0)
    );
    const savings = totalIncome - totalExpenses;
    const savingsPercentage =
      totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    outputDiv.innerHTML = `
      <h3>Summary</h3>
      <p>Total Income: ${totalIncome.toFixed(2)} kr</p>
      <p>Total Expenses: ${totalExpenses.toFixed(2)} kr</p>
      <p>Savings: ${savings.toFixed(2)} kr (${savingsPercentage.toFixed(
      1
    )}% of income)</p>
    `;
  }

  if (trumfButton) {
    trumfButton.onclick = async function () {
      console.log("Trumf button clicked");

      // Get the token from the input
      const tokenInput = document.getElementById("trumfTokenInput");
      const token = tokenInput ? tokenInput.value.trim() : "";

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("trumfToken", token);

      // Show loading state
      const trumfOutput = document.getElementById("trumfOutput");
      trumfOutput.innerHTML = `<div class="loading">Fetching your Trumf data...</div>`;
      trumfButton.disabled = true;
      trumfButton.textContent = "Loading...";

      try {
        // Fetch Trumf transactions
        const result = await fetchTrumfTransactions(token);
        console.log("Trumf API response:", result);

        if (result.error) {
          trumfOutput.innerHTML = `<div class="error">Error: ${result.error}</div>`;
          trumfButton.disabled = false;
          trumfButton.textContent = "Import Trumf Data";
          return;
        }

        const transactions = result.transactions;

        if (!transactions || transactions.length === 0) {
          trumfOutput.innerHTML = `<div class="info">No Trumf transactions found</div>`;
          trumfButton.disabled = false;
          trumfButton.textContent = "Import Trumf Data";
          return;
        }

        trumfOutput.innerHTML = `<p>Found ${transactions.length} transactions. Fetching receipt details...</p>`;

        // Test direct API access first with one transaction
        if (transactions.length > 0) {
          const firstBatchId = transactions[0].batchId;
          const directTest = await testDirectTrumfAccess(token, firstBatchId);

          if (!directTest.success) {
            trumfOutput.innerHTML = `
              <div class="auth-required-message">
                <h3>⚠️ Authentication Issue</h3>
                <p>Could not access receipt details with the current token.</p>
                <p>Please follow these updated steps:</p>
                <ol>
                  <li>Go to <a href="https://www.trumf.no" target="_blank">Trumf.no</a> and log in</li>
                  <li>Go to <a href="https://www.trumf.no/historikk" target="_blank">receipts page</a></li>
                  <li>Click on one of the receipt icons in the list</li>
                  <li>If prompted, confirm your password and enter any SMS code</li>
                  <li>Open Developer Tools (F12 or Option + CMD + J)</li>
                  <li>Go to the "Console" tab</li>
                  <li>Copy and paste this code: <code>copy(window._siteGlobalSettings.userToken)</code></li>
                  <li>The token is now in your clipboard - paste it in the field above</li>
                </ol>
              </div>
            `;
            trumfButton.disabled = false;
            trumfButton.textContent = "Import Trumf Data";
            return;
          }
        }

        // Get details for the first 5 transactions
        const limitedTransactions = transactions.slice(0, 5);
        const receipts = [];

        for (const transaction of limitedTransactions) {
          const batchId = transaction.batchId;

          if (batchId) {
            trumfOutput.innerHTML += `<p>Fetching receipt for transaction ${batchId}...</p>`;

            // Try direct API access first since it works
            const directResult = await testDirectTrumfAccess(token, batchId);

            if (directResult.success) {
              receipts.push({
                transaction,
                receipt: directResult.data,
              });
            } else {
              // Fall back to our backend
              const receiptData = await fetchTrumfReceipt(token, batchId);

              if (!receiptData.error) {
                receipts.push({
                  transaction,
                  receipt: receiptData,
                });
              }
            }
          }
        }

        // Display the receipts
        displayTrumfReceipts(receipts);
      } catch (error) {
        console.error("Error fetching Trumf data:", error);
        trumfOutput.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      } finally {
        // Reset button state
        trumfButton.disabled = false;
        trumfButton.textContent = "Import Trumf Data";
      }
    };
  }

  function resetTrumfButton() {
    if (trumfButton) {
      trumfButton.disabled = false;
      trumfButton.textContent = "Import Trumf Data";
    }
  }

  // Function to display Trumf receipts
  function displayTrumfReceipts(receipts) {
    const trumfOutput = document.getElementById("trumfOutput");

    if (!receipts || receipts.length === 0) {
      trumfOutput.innerHTML = `<div class="info">No detailed receipts available</div>`;
      return;
    }

    // Define categories for Norwegian grocery items
    const categories = {
      meat: {
        count: 0,
        amount: 0,
        items: [],
        label: "Kjøtt",
        keywords:
          /kjøtt|kylling|biff|svin|bacon|pølse|ribbe|entrecote|farse|hamburger|karbonader|kjøttdeig|kjøttboller|skinke(?!ost)|filet|ytrefilet|indrefilet|flatbiff|bogstek|stek|kalkun|lår(?!kartong)/i,
      },
      fish: {
        count: 0,
        amount: 0,
        items: [],
        label: "Fisk & Sjømat",
        keywords:
          /fisk|laks|ørret|torsk|sei|makrell|reker|krabbe|scampi|reke(?!varer)|fiskepinner|fiskekaker|fiskegrateng|fiskepudding|kaviar|sushi|sjømat/i,
      },
      dairy: {
        count: 0,
        amount: 0,
        items: [],
        label: "Meieriprodukter",
        keywords:
          /melk|ost|rømme|yoghurt|fløte|smør|kesam|kefir|creme fraiche|skyr|cottage|brunost|jarlsberg|norvegia|gulost|kremost|kvarg|crème|philadelpia|kvit|mjølk|youghurt|skyr|tine|oikos|kremfløte/i,
      },
      bread: {
        count: 0,
        amount: 0,
        items: [],
        label: "Brød & Bakervarer",
        keywords:
          /brød|rundstykk|baguett|knekkebrød|lompe|lefse|pita|tortilla|ciabatta|croissant|bolle|bakverk|gjærbakst|kake(?!form)|muffin|pai|wienerbakst|bakeri|gjærdeig|focaccia|horn|scone|bagel/i,
      },
      fruits_veg: {
        count: 0,
        amount: 0,
        items: [],
        label: "Frukt & Grønt",
        keywords:
          /eple|banan|appelsin|kiwi|sitron|lime|frukt|bær|jordbær|blåbær|bringebær|druer|nektarin|pære|melon|ananas|mango|avokado|tomat|agurk|salat|løk|gulrot|potet|brokkoli|blomkål|paprika|sopp|grønnsak|squash|purre|kål|selleri|spinat|asparges|aubergine|rosenkål/i,
      },
      alcohol: {
        count: 0,
        amount: 0,
        items: [],
        label: "Alkohol",
        keywords:
          /øl|vin|vodka|whisky|aquavit|brennevin|cider|likør|rom|tequila|gin|cognac|champagne|prosecco|musserende|sider/i,
      },
      tobacco: {
        count: 0,
        amount: 0,
        items: [],
        label: "Tobakk",
        keywords: /snus|røyk|tobakk|sigar|sigarett|rullings|filter|lighter/i,
      },
      soft_drinks: {
        count: 0,
        amount: 0,
        items: [],
        label: "Brus & Drikke",
        keywords:
          /brus|cola|pepsi|fanta|sprite|solo|urge|battery|redbull|monster|energidrikk|saft|juice|iste|iskaffe|vann|springvann|farris|bonaqua|imsdal/i,
      },
      snacks: {
        count: 0,
        amount: 0,
        items: [],
        label: "Snacks & Godteri",
        keywords:
          /chips|sjokolade|godteri|snacks|potetgull|smågodt|sørlandspotet|salt(?!tabletter)|ostepop|popcorn|nøtter|kjeks|twist|karamell|lakris|vingummi|seigmenn|konfekt|tyggegummi|drops|toffee|marshmallow|skumgodt/i,
      },
      frozen: {
        count: 0,
        amount: 0,
        items: [],
        label: "Frysevarer",
        keywords:
          /frys|is(?!kaffe)(?!te)|frossent|pizza|grandiosa|findus|wienerpølse|pommes|frites/i,
      },
      household: {
        count: 0,
        amount: 0,
        items: [],
        label: "Husholdning",
        keywords:
          /tørk|vask|hygiene|papir|toalettpapir|tannkrem|såpe|shampo|dusjsåpe|oppvask|vaskemiddel|rengjøring|zalo|jif|ajax|lyspære|batteri|serviett|deodorant|tannbørste/i,
      },
      other: { count: 0, amount: 0, items: [], label: "Annet", keywords: /.*/ },
    };

    let html = `<h3>Your Trumf Receipts (${receipts.length})</h3>`;
    let totalSpent = 0;
    let totalItems = 0;

    receipts.forEach(({ transaction, receipt }) => {
      // Extract store name and date from the transaction
      const store = transaction.beskrivelse1 || "Unknown Store";
      const dateStr = transaction.transaksjonsDato || transaction.purchaseTime;
      const date = dateStr
        ? new Date(dateStr).toLocaleDateString()
        : "Invalid Date";
      const amount = parseFloat(transaction.amount || 0);
      totalSpent += amount;

      // Try different ways to access items based on receipt structure
      let items = [];
      if (receipt && receipt.items && Array.isArray(receipt.items)) {
        items = receipt.items;
      } else if (receipt && receipt.kvittering && receipt.kvittering.varer) {
        items = receipt.kvittering.varer;
      } else if (receipt && receipt.varelinjer) {
        items = receipt.varelinjer;
      } else if (receipt && receipt.data && receipt.data.items) {
        items = receipt.data.items;
      } else {
        // Log the receipt structure to help debug
        console.log("Receipt structure:", receipt);
        if (receipt) {
          console.log("Receipt keys:", Object.keys(receipt));
        }
      }

      let itemsHtml = "";

      if (items && items.length > 0) {
        totalItems += items.length;

        items.forEach((item) => {
          // Try different property names based on observed API responses
          const description =
            item.description || item.navn || item.varenavn || "Unknown Product";
          const price = parseFloat(item.price || item.pris || item.beløp || 0);

          // Categorize the item
          let categorized = false;

          for (const [categoryKey, category] of Object.entries(categories)) {
            if (categoryKey === "other") continue; // Skip the "other" category in this loop

            if (category.keywords.test(description)) {
              category.count++;
              category.amount += price;
              category.items.push({
                name: description,
                price: price,
              });
              categorized = true;
              break;
            }
          }

          // If no category matched, put in "other"
          if (!categorized) {
            categories.other.count++;
            categories.other.amount += price;
            categories.other.items.push({
              name: description,
              price: price,
            });
          }

          // Create item row HTML
          itemsHtml += `
            <div class="item-row">
              <span class="item-name">${description}</span>
              <span class="item-price">${price.toFixed(2)} kr</span>
            </div>
          `;
        });
      } else {
        itemsHtml = "<p>No item details available</p>";
      }

      // Create receipt card HTML
      html += `
        <div class="receipt-card">
          <div class="receipt-header">
            <div>
              <strong>${store}</strong>
              <div>${date}</div>
            </div>
            <div>
              <strong>${amount.toFixed(2)} kr</strong>
            </div>
          </div>
          <div class="receipt-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    // Add category insights section if we have items
    if (totalItems > 0) {
      html += `
        <div class="trumf-insights">
          <h3>Spending Insights from Trumf</h3>
          <div class="insights-summary">
            <p><strong>Total spent:</strong> ${totalSpent.toFixed(
              2
            )} kr on ${totalItems} items</p>
            <p><strong>Average per receipt:</strong> ${(
              totalSpent / receipts.length
            ).toFixed(2)} kr</p>
          </div>
          
          <div class="category-insights">
            <h4>Spending by Category</h4>
            <div class="category-bars">
      `;

      // Filter out empty categories and sort by amount spent
      const activeCategories = Object.entries(categories)
        .filter(([_, data]) => data.count > 0)
        .sort((a, b) => b[1].amount - a[1].amount);

      // Add category breakdown
      activeCategories.forEach(([_, category], index) => {
        const percentage = ((category.amount / totalSpent) * 100).toFixed(1);

        html += `
          <div class="category-item">
            <div class="category-header">
              <span class="category-name">${category.label} (${
          category.count
        } items)</span>
              <span class="category-amount">${category.amount.toFixed(
                2
              )} kr</span>
            </div>
            <div class="category-bar-container">
              <div class="category-bar category-color-${index}" style="width: ${percentage}%"></div>
              <span class="category-percentage">${percentage}%</span>
            </div>
          </div>
        `;
      });

      // Add expandable lists for each category with items
      html += `
            </div>
            
            <div class="category-details">
              <h4>Detailed Category Breakdown</h4>
      `;

      activeCategories.forEach(([categoryKey, category]) => {
        if (category.items.length === 0) return;

        // Sort items by price (highest first)
        const sortedItems = [...category.items].sort(
          (a, b) => b.price - a.price
        );

        html += `
          <details class="category-detail">
            <summary>
              <span class="category-detail-name">${category.label}</span>
              <span class="category-detail-stats">${
                category.count
              } items · ${category.amount.toFixed(2)} kr</span>
            </summary>
            <div class="category-items">
        `;

        sortedItems.forEach((item) => {
          html += `
            <div class="category-item-row">
              <span class="category-item-name">${item.name}</span>
              <span class="category-item-price">${item.price.toFixed(
                2
              )} kr</span>
            </div>
          `;
        });

        html += `
            </div>
          </details>
        `;
      });

      html += `
            </div>
          </div>
        </div>
      `;
    }

    trumfOutput.innerHTML = html;
  }

  // Function to integrate Trumf data with general transaction data
  function integrateWithTransactionData(receipts) {
    // This function will be used to enhance your existing transaction data
    // with the detailed information from Trumf

    // 1. Get transactions related to grocery shopping
    const groceryTransactions = receipts.map((receipt) => {
      return {
        date: new Date(receipt.transaction.purchaseTime),
        store: receipt.transaction.shop?.name || "Unknown Store",
        amount: receipt.transaction.amount || 0,
        items: receipt.receipt.items || [],
      };
    });

    console.log(
      "Grocery transactions with detailed data:",
      groceryTransactions
    );

    // You can use this data to enhance your charts or create new visualizations
    // For now, we'll just log it to the console
  }

  // Add this debugging function

  function debugTrumfResponse(token) {
    const trumfOutput = document.getElementById("trumfOutput");
    trumfOutput.innerHTML = `<div class="loading">Debugging Trumf API response structure...</div>`;

    fetchTrumfTransactions(token)
      .then((result) => {
        if (result.transactions && result.transactions.length > 0) {
          const firstTransaction = result.transactions[0];
          const batchId = firstTransaction.batchId;

          console.log("First transaction:", firstTransaction);
          console.log("Batch ID for receipt:", batchId);

          if (batchId) {
            return testDirectTrumfAccess(token, batchId);
          } else {
            throw new Error("No batch ID found in transaction");
          }
        } else {
          throw new Error("No transactions found");
        }
      })
      .then((receiptResult) => {
        console.log("Full receipt structure:", receiptResult);

        let receiptDetails = "";

        if (receiptResult.data) {
          receiptDetails = `
            <h4>Receipt Data Structure</h4>
            <pre>${JSON.stringify(receiptResult.data, null, 2)}</pre>
          `;
        }

        trumfOutput.innerHTML = `
          <div class="debug-info">
            <h3>Trumf API Debug Information</h3>
            <p>Check the browser console for detailed output.</p>
            ${receiptDetails}
          </div>
        `;
      })
      .catch((error) => {
        trumfOutput.innerHTML = `<div class="error">Debug Error: ${error.message}</div>`;
        console.error("Debug error:", error);
      });
  }

  // Add a debug button to the UI
  if (trumfButton && trumfButton.parentNode) {
    const debugBtn = document.createElement("button");
    debugBtn.textContent = "Debug Trumf API";
    debugBtn.className = "debug-btn";
    debugBtn.style.backgroundColor = "#5d6d7e";
    debugBtn.style.marginLeft = "10px";
    trumfButton.parentNode.appendChild(debugBtn);

    debugBtn.onclick = function () {
      const tokenInput = document.getElementById("trumfTokenInput");
      const token = tokenInput ? tokenInput.value.trim() : "";

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      debugTrumfResponse(token);
    };
  }

  // Add Kassalapp Debug Button
  addKassalappDebugButton();
});

// Update your displayReceiptItems function
function displayReceiptItems(items, receiptContainer) {
  if (!items || items.length === 0) {
    const noItemsEl = document.createElement("p");
    noItemsEl.textContent = "No item details available";
    receiptContainer.appendChild(noItemsEl);
    return;
  }

  // Create a table for the items
  const itemsTable = document.createElement("table");
  itemsTable.className = "receipt-items-table";

  // Add table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Price</th>
    </tr>
  `;
  itemsTable.appendChild(thead);

  // Add item rows
  const tbody = document.createElement("tbody");
  items.forEach((item) => {
    const tr = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;
    tr.appendChild(nameCell);

    const qtyCell = document.createElement("td");
    qtyCell.textContent = item.quantity;
    tr.appendChild(qtyCell);

    const priceCell = document.createElement("td");
    priceCell.textContent = `${parseFloat(item.price).toFixed(2)} kr`;
    priceCell.className = "price-cell";
    tr.appendChild(priceCell);

    tbody.appendChild(tr);
  });
  itemsTable.appendChild(tbody);

  receiptContainer.appendChild(itemsTable);
}

// Add this function to your main.js
function addKassalappDebugButton() {
  const trumfSection = document.querySelector(".trumf-section");
  if (!trumfSection) return;

  const debugDiv = document.createElement("div");
  debugDiv.className = "kassalapp-debug";
  debugDiv.style.marginTop = "20px";
  debugDiv.style.padding = "15px";
  debugDiv.style.backgroundColor = "#f8f9fa";
  debugDiv.style.borderRadius = "5px";

  debugDiv.innerHTML = `
    <h4>Kassalapp Integration Debug</h4>
    <p>Use these tools to understand how Kassalapp integrates with Trumf:</p>
    <div class="debug-buttons">
      <button id="monitorKassalappBtn" class="debug-btn">Monitor Kassalapp API Calls</button>
      <button id="testMultiEndpointBtn" class="debug-btn">Test Multiple Endpoints</button>
    </div>
    <div id="kassalappDebugOutput" class="debug-output" style="margin-top: 15px;">
      <p class="info">Click a button above to start debugging</p>
    </div>
  `;

  trumfSection.appendChild(debugDiv);

  // Set up event handlers
  document
    .getElementById("monitorKassalappBtn")
    .addEventListener("click", function () {
      const tokenInput = document.getElementById("trumfTokenInput");
      const token = tokenInput ? tokenInput.value.trim() : "";

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      const debugOutput = document.getElementById("kassalappDebugOutput");
      debugOutput.innerHTML = `
      <p><strong>Monitoring Setup Instructions:</strong></p>
      <ol>
        <li>Copy the code below</li>
        <li>Open <a href="https://www.kassalapp.no" target="_blank">Kassalapp</a> in a new tab</li>
        <li>Open browser Developer Tools (F12)</li>
        <li>Paste the code in Console and press Enter</li>
        <li>Navigate to a receipt in Kassalapp and watch the console</li>
      </ol>
      
      <pre style="background:#eee;padding:10px;overflow:auto;max-height:200px;">
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url && (url.includes('trumf') || url.includes('kvittering'))) {
      console.log('KASSALAPP FETCH:', {url, options});
    }
    return originalFetch.apply(this, arguments);
  };
  
  const originalXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function() {
    this.addEventListener('load', function() {
      if (arguments[1] && (arguments[1].includes('trumf') || arguments[1].includes('kvittering'))) {
        console.log('KASSALAPP XHR:', {
          url: arguments[1],
          method: arguments[0],
          response: this.responseText.substring(0, 500) + '...'
        });
      }
    });
    return originalXHR.apply(this, arguments);
  };
  console.log('API monitoring active - navigate to a Kassalapp receipt to see the API calls');
})();
      </pre>
    `;
    });

  document
    .getElementById("testMultiEndpointBtn")
    .addEventListener("click", async function () {
      const tokenInput = document.getElementById("trumfTokenInput");
      const token = tokenInput ? tokenInput.value.trim() : "";

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      const debugOutput = document.getElementById("kassalappDebugOutput");
      debugOutput.innerHTML = `<p>Testing multiple endpoints with your token...</p>`;

      try {
        // First get a transaction to use for testing
        const result = await fetchTrumfTransactions(token);

        if (
          result.error ||
          !result.transactions ||
          !result.transactions.length
        ) {
          debugOutput.innerHTML = `<p class="error">Could not fetch transactions: ${
            result.error || "No transactions found"
          }</p>`;
          return;
        }

        // Use the first transaction's batch ID
        const batchId = result.transactions[0].batchId;
        debugOutput.innerHTML += `<p>Found transaction with batchId: ${batchId}</p><p>Testing endpoints...</p>`;

        // Test multiple endpoints
        const endpoints = [
          `https://platform-rest-prod.ngdata.no/trumf/medlemskap/transaksjoner/digitalkvittering/${batchId}`,
          `https://www.trumf.no/api/digitalkvittering/${batchId}`,
          `https://api.trumf.no/digitalkvittering/${batchId}`,
          `https://api.ngdata.no/trumf/digitalkvittering/${batchId}`,
          `https://platform-rest-prod.ngdata.no/trumf/kvittering/${batchId}`,
        ];

        let endpointResults = "";
        let successFound = false;

        for (const endpoint of endpoints) {
          try {
            debugOutput.innerHTML =
              `<p>Testing: ${endpoint}</p>` + endpointResults;

            const response = await fetch(endpoint, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });

            if (response.status === 200) {
              const data = await response.json();
              successFound = true;
              endpointResults += `
              <div style="margin-bottom:15px;padding:10px;background:#d4edda;border-radius:4px;">
                <p><strong>✅ SUCCESS: ${endpoint}</strong></p>
                <p>Status: 200</p>
                <details>
                  <summary>View response</summary>
                  <pre>${JSON.stringify(data, null, 2)}</pre>
                </details>
              </div>
            `;
            } else {
              endpointResults += `
              <div style="margin-bottom:15px;padding:10px;background:#f8d7da;border-radius:4px;">
                <p><strong>❌ FAILED: ${endpoint}</strong></p>
                <p>Status: ${response.status}</p>
              </div>
            `;
            }
          } catch (error) {
            endpointResults += `
            <div style="margin-bottom:15px;padding:10px;background:#f8d7da;border-radius:4px;">
              <p><strong>❌ ERROR: ${endpoint}</strong></p>
              <p>Error: ${error.message}</p>
            </div>
          `;
          }
        }

        debugOutput.innerHTML = `
        <h4>Endpoint Testing Results</h4>
        <p>${
          successFound
            ? "✅ Successfully found working endpoint(s)!"
            : "❌ No working endpoints found"
        }</p>
        ${endpointResults}
      `;
      } catch (error) {
        debugOutput.innerHTML = `<p class="error">Error: ${error.message}</p>`;
      }
    });
}

// Add this function after your DOMContentLoaded event listener
function addDebugTrumfButton() {
  const trumfSection = document.querySelector(".trumf-section");
  if (!trumfSection) return;

  // Create debug button
  const debugButton = document.createElement("button");
  debugButton.textContent = "Debug Trumf API";
  debugButton.className = "debug-btn";
  debugButton.style.backgroundColor = "#6c757d";
  debugButton.style.color = "white";
  debugButton.style.marginLeft = "10px";

  // Add button next to the existing button
  const trumfBtn = document.getElementById("fetchTrumfBtn");
  if (trumfBtn && trumfBtn.parentNode) {
    trumfBtn.parentNode.appendChild(debugButton);
  } else {
    trumfSection.appendChild(debugButton);
  }

  // Add click handler for debug button
  debugButton.onclick = async function () {
    const token =
      document.getElementById("trumfTokenInput")?.value?.trim() || "";

    if (!token) {
      alert("Please enter your Trumf token first");
      return;
    }

    const trumfOutput = document.getElementById("trumfOutput");
    trumfOutput.innerHTML = `<div class="loading">Fetching transactions for debugging...</div>`;

    try {
      // Get transactions
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

      // Show transaction selection for debugging
      let debugHtml = `
        <h3>Debug Trumf API</h3>
        <p>Select a transaction to debug:</p>
        <div class="debug-transactions">
      `;

      // Show 10 transactions for selection
      const transactions = transactionsResult.transactions.slice(0, 10);

      transactions.forEach((tx, index) => {
        const store = tx.beskrivelse1 || "Unknown Store";
        const date = tx.transaksjonsTidspunkt
          ? new Date(tx.transaksjonsTidspunkt).toLocaleDateString()
          : "Invalid Date";
        const amount = parseFloat(tx.belop || 0);

        debugHtml += `
          <div class="debug-transaction" data-batch-id="${tx.batchId || ""}">
            <div class="debug-transaction-info">
              <span class="debug-store">${store}</span>
              <span class="debug-date">${date}</span>
              <span class="debug-amount">${amount.toFixed(2)} kr</span>
            </div>
            <button class="debug-receipt-btn" data-batch-id="${
              tx.batchId || ""
            }">Debug Receipt</button>
          </div>
        `;
      });

      debugHtml += `</div>`;
      trumfOutput.innerHTML = debugHtml;

      // Add event listeners to debug buttons
      document.querySelectorAll(".debug-receipt-btn").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const batchId = this.getAttribute("data-batch-id");
          if (!batchId) return;

          // Create a debug result container
          const resultDiv = document.createElement("div");
          resultDiv.className = "debug-result";
          resultDiv.innerHTML = `<div class="loading">Debugging receipt ${batchId}...</div>`;

          // Insert after the transactions list
          const transactionsDiv = document.querySelector(".debug-transactions");
          if (transactionsDiv && transactionsDiv.nextSibling) {
            trumfOutput.insertBefore(resultDiv, transactionsDiv.nextSibling);
          } else {
            trumfOutput.appendChild(resultDiv);
          }

          // Debug the receipt
          try {
            const debugDiv = await debugTrumfReceipt(token, batchId);
            resultDiv.innerHTML = "";
            resultDiv.appendChild(debugDiv);
          } catch (error) {
            resultDiv.innerHTML = `<div class="error-message">Error debugging receipt: ${error.message}</div>`;
          }
        });
      });
    } catch (error) {
      trumfOutput.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
  };
}

// Call this function when the document is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Your existing code...
  addDebugTrumfButton();
});

// Trumf integration functions
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
    container.innerHTML = `<div class="error">${
      receiptData.error || "Failed to load receipt"
    }</div>`;
    return;
  }

  const receipt = receiptData.receipt;
  if (!receipt) {
    container.innerHTML = "<div class='error'>No receipt data found</div>";
    return;
  }

  const items = receipt.processed_items || [];
  if (items.length === 0) {
    container.innerHTML = "<p>No items found in this receipt.</p>";
    return;
  }

  let html = `
    <table class="receipt-items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th class="price-cell">Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item) => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td class="price-cell">${Number(item.price).toFixed(2)} kr</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// Initialize Trumf integration
function initTrumfIntegration() {
  const trumfSection =
    document.querySelector(".trumf-section") ||
    document.getElementById("trumfComponent");
  if (!trumfSection) return;

  // Add the Trumf integration content
  trumfSection.innerHTML = `
    <h2>🛒 Trumf Receipt Integration</h2>
    <p>Import your detailed grocery data from Trumf to enhance your spending analysis.</p>
    
    <div class="input-group mb-3">
      <input type="text" id="trumfTokenInput" class="form-control" placeholder="Paste your Trumf token here">
      <button class="btn btn-primary" id="fetchTrumfBtn">Import Trumf Data</button>
    </div>
    
    <div class="small text-muted mt-2">
      <details>
        <summary>How to get your Trumf token</summary>
        <ol>
          <li>Go to Trumf.no and log in</li>
          <li>Open Developer Tools (F12 or Ctrl+Shift+I)</li>
          <li>Go to the Console tab</li>
          <li>Paste this code: <code>copy(window._siteGlobalSettings.userToken)</code></li>
          <li>The token is now in your clipboard - paste it above</li>
        </ol>
      </details>
    </div>
    
    <div id="trumfOutput" class="mt-4"></div>
  `;

  // Attach event listener
  const fetchTrumfBtn = document.getElementById("fetchTrumfBtn");
  const trumfTokenInput = document.getElementById("trumfTokenInput");
  const trumfOutput = document.getElementById("trumfOutput");

  if (fetchTrumfBtn && trumfTokenInput) {
    // Load token from localStorage if available
    const savedToken = localStorage.getItem("trumfToken");
    if (savedToken) {
      trumfTokenInput.value = savedToken;
    }

    fetchTrumfBtn.addEventListener("click", async function () {
      const token = trumfTokenInput.value.trim();

      if (!token) {
        alert("Please enter your Trumf token first");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("trumfToken", token);

      // Show loading
      trumfOutput.innerHTML =
        '<div class="loading">Loading your Trumf data...</div>';

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
            : "Unknown Date";
          const amount = parseFloat(transaction.belop || 0).toFixed(2);

          html += `
            <div class="receipt-card">
              <div class="receipt-header">
                <h4>${store}</h4>
                <div class="receipt-meta">
                  <span class="date">${date}</span>
                  <span class="amount">${amount} kr</span>
                </div>
              </div>
              <div class="receipt-body" id="receipt-${
                transaction.batchId || "unknown"
              }">
                <div class="loading">Loading details...</div>
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

          const receiptData = await fetchTrumfReceipt(
            token,
            transaction.batchId
          );
          displayTrumfReceipt(receiptData, receiptContainer);
        }
      } catch (error) {
        trumfOutput.innerHTML = `<div class="error">${error.message}</div>`;
      }
    });
  }
}

// Initialize file upload handling
function initFileUpload() {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.querySelector('input[type="file"]');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", async function () {
      if (!fileInput.files[0]) {
        alert("Please choose a file first");
        return;
      }

      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        uploadBtn.textContent = "Uploading...";
        uploadBtn.disabled = true;

        const response = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Process chart data
        if (data.transactions) {
          renderCharts(data.transactions);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(`Error: ${error.message}`);
      } finally {
        uploadBtn.textContent = "Upload File";
        uploadBtn.disabled = false;
      }
    });
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:8000" // Local development
      : ""; // Production (same domain)

  window.API_URL = API_URL; // Make API_URL globally available

  initFileUpload();
  initTrumfIntegration();
});

// Import components
import UploadForm from "../../components/upload-form.js";
import TransactionList from "../../components/transaction-list.js";
import Dashboard from "../../components/dashboard.js";

class App {
  constructor() {
    this.uploadForm = null;
    this.transactionList = null;
    this.dashboard = null;

    this.init();
  }

  init() {
    // Create dashboard first so charts are ready to receive data
    this.dashboard = new Dashboard();

    // Initialize upload form
    this.uploadForm = new UploadForm();

    // Create transaction list in the output section
    // The container for the transaction list will be dynamically created
    this.createTransactionListContainer();
    this.transactionList = new TransactionList("transaction-list");

    // Set up Trumf integration buttons if they exist
    this.setupTrumfIntegration();
  }

  createTransactionListContainer() {
    // Create a container for the transaction list if it doesn't exist
    if (!document.getElementById("transaction-list")) {
      const container = document.createElement("div");
      container.id = "transaction-list";
      container.className = "transaction-list-container";

      const outputSection = document.getElementById("output");
      if (outputSection) {
        outputSection.appendChild(container);
      }
    }
  }

  setupTrumfIntegration() {
    const fetchTrumfBtn = document.getElementById("fetchTrumfBtn");
    const debugTrumfBtn = document.getElementById("debugTrumfBtn");
    const tokenInput = document.getElementById("trumfTokenInput");
    const trumfOutput = document.getElementById("trumfOutput");

    if (fetchTrumfBtn && tokenInput) {
      fetchTrumfBtn.addEventListener("click", async () => {
        const token = tokenInput.value.trim();
        if (!token) {
          if (trumfOutput) {
            trumfOutput.innerHTML =
              '<div class="error">Please enter a valid Trumf token</div>';
          }
          return;
        }

        try {
          if (trumfOutput) {
            trumfOutput.innerHTML =
              '<div class="loading">Fetching Trumf data...</div>';
          }

          const response = await fetch(
            "http://localhost:8000/api/trumf/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const statusText = response.statusText || "";
            let errorMessage = `Failed to fetch Trumf data: ${response.status}`;

            if (response.status === 404) {
              errorMessage =
                "API endpoint not found (404). Please check that the backend server is running with the correct routes.";
            } else if (response.status === 401) {
              errorMessage =
                "Authentication failed. Please check your Trumf token.";
            } else if (response.status >= 500) {
              errorMessage =
                "Server error. Please try again later or check the backend logs.";
            }

            throw new Error(errorMessage);
          }

          const data = await response.json();

          if (trumfOutput) {
            if (data.transactions && data.transactions.length > 0) {
              this.displayTrumfData(data.transactions);
            } else if (Array.isArray(data) && data.length > 0) {
              // Handle case where API returns array directly
              this.displayTrumfData(data);
            } else {
              trumfOutput.innerHTML =
                '<div class="info">No Trumf transaction data found</div>';
            }
          }
        } catch (error) {
          if (trumfOutput) {
            trumfOutput.innerHTML = `<div class="error">Error: ${error.message}</div>`;
          }
          console.error("Trumf API error:", error);
        }
      });
    }

    if (debugTrumfBtn && tokenInput) {
      debugTrumfBtn.addEventListener("click", async () => {
        const token = tokenInput.value.trim();
        if (!token) {
          if (trumfOutput) {
            trumfOutput.innerHTML =
              '<div class="error">Please enter a valid Trumf token</div>';
          }
          return;
        }

        try {
          if (trumfOutput) {
            trumfOutput.innerHTML =
              '<div class="loading">Testing Trumf API connection...</div>';
          }

          // First get transactions
          const txnResponse = await fetch(
            "http://localhost:8000/api/trumf/transactions",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!txnResponse.ok) {
            const statusText = txnResponse.statusText || "";
            let errorMessage = `Failed to fetch Trumf transactions: ${txnResponse.status}`;

            if (txnResponse.status === 404) {
              errorMessage =
                "API endpoint not found (404). Please check that the backend server is running with the correct routes.";
            } else if (txnResponse.status === 401) {
              errorMessage =
                "Authentication failed. Please check your Trumf token.";
            } else if (txnResponse.status >= 500) {
              errorMessage =
                "Server error. Please try again later or check the backend logs.";
            }

            throw new Error(errorMessage);
          }

          const txnData = await txnResponse.json();

          // If we have transactions, fetch a receipt for the first one
          const transactions =
            txnData.transactions || (Array.isArray(txnData) ? txnData : []);

          if (transactions.length > 0) {
            const firstTxn = transactions[0];
            const batchId = firstTxn.batchId || firstTxn.id;

            if (batchId) {
              const receiptResponse = await fetch(
                "http://localhost:8000/api/trumf/direct-debug/" + batchId,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!receiptResponse.ok) {
                const statusText = receiptResponse.statusText || "";
                let errorMessage = `Failed to fetch receipt: ${receiptResponse.status}`;

                if (receiptResponse.status === 404) {
                  errorMessage =
                    "Debug API endpoint not found (404). Please check that the backend server is running with the correct routes.";
                } else if (receiptResponse.status === 401) {
                  errorMessage =
                    "Authentication failed. Please check your Trumf token.";
                } else if (receiptResponse.status >= 500) {
                  errorMessage =
                    "Server error when fetching debug data. Please try again later or check the backend logs.";
                }

                throw new Error(errorMessage);
              }

              const receiptData = await receiptResponse.json();

              if (trumfOutput) {
                let html = '<div class="debug-result">';
                html += "<h3>Trumf API Debug Results</h3>";

                html += '<div class="debug-section">';
                html += `<p>Successfully retrieved ${transactions.length} transactions</p>`;

                if (
                  receiptData.processedItems &&
                  receiptData.processedItems.length > 0
                ) {
                  html += `<p>Successfully retrieved detailed receipt with ${receiptData.processedItems.length} items</p>`;

                  html += "<h4>Sample Receipt Items:</h4>";
                  html += '<ul class="receipt-items">';

                  for (
                    let i = 0;
                    i < Math.min(5, receiptData.processedItems.length);
                    i++
                  ) {
                    const item = receiptData.processedItems[i];
                    html += `<li>${item.name} - NOK ${item.price.toFixed(
                      2
                    )}</li>`;
                  }

                  html += "</ul>";
                } else {
                  html +=
                    "<p>No receipt items found or error in receipt processing</p>";
                }

                html += "</div>";
                html += "</div>";

                trumfOutput.innerHTML = html;
              }
            } else {
              if (trumfOutput) {
                trumfOutput.innerHTML =
                  '<div class="warning">Found transactions but could not fetch receipt details (no batch ID)</div>';
              }
            }
          } else {
            if (trumfOutput) {
              trumfOutput.innerHTML =
                '<div class="info">No Trumf transactions found to debug</div>';
            }
          }
        } catch (error) {
          if (trumfOutput) {
            trumfOutput.innerHTML = `<div class="error">API Debug Error: ${error.message}</div>`;
          }
          console.error("Trumf API debug error:", error);
        }
      });
    }
  }

  displayTrumfData(transactions) {
    const trumfOutput = document.getElementById("trumfOutput");
    if (!trumfOutput) return;

    let html = '<div class="trumf-results">';
    html += "<h3>Trumf Transaction History</h3>";

    html += `<p>Found ${transactions.length} Trumf transactions</p>`;

    html += '<table class="trumf-transactions">';
    html += "<thead>";
    html += "<tr>";
    html += "<th>Date</th>";
    html += "<th>Store</th>";
    html += "<th>Amount</th>";
    html += "<th>Bonus</th>";
    html += "<th>Actions</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    transactions.forEach((txn) => {
      try {
        // Handle the actual Trumf API format based on the API call results
        const txnDate =
          txn.transaksjonsTidspunkt || txn.transactionTime || txn.date || "";
        const date = txnDate
          ? new Date(txnDate).toLocaleDateString()
          : "Unknown";
        const store = txn.beskrivelse || txn.storeName || "Unknown Store";
        const amount = txn.belop || txn.amount || txn.totalAmount || 0;
        const bonus = txn.bonus || txn.totalBonus || 0;
        const batchId = txn.batchId || txn.id;

        // Ensure we have a valid batch ID for the receipt lookup
        if (!batchId) {
          console.warn("Transaction missing batchId", txn);
        }

        html += "<tr>";
        html += `<td>${date}</td>`;
        html += `<td>${store}</td>`;
        html += `<td>NOK ${parseFloat(amount).toFixed(2)}</td>`;
        html += `<td>NOK ${parseFloat(bonus).toFixed(2)}</td>`;
        html += `<td>${
          batchId
            ? `<button class="view-receipt-btn" data-batch-id="${batchId}">View Receipt</button>`
            : "No receipt"
        }</td>`;
        html += "</tr>";
      } catch (error) {
        console.error("Error processing transaction:", error, txn);
      }
    });

    html += "</tbody>";
    html += "</table>";
    html += "</div>";

    trumfOutput.innerHTML = html;

    // Add event listeners to receipt buttons
    const receiptButtons = trumfOutput.querySelectorAll(".view-receipt-btn");
    receiptButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const batchId = btn.getAttribute("data-batch-id");
        this.fetchTrumfReceipt(batchId);
      });
    });
  }

  async fetchTrumfReceipt(batchId) {
    const trumfOutput = document.getElementById("trumfOutput");
    const token = document.getElementById("trumfTokenInput").value.trim();

    try {
      if (trumfOutput) {
        trumfOutput.innerHTML =
          '<div class="loading">Fetching receipt details...</div>';
      }

      const response = await fetch(
        "http://localhost:8000/api/trumf/receipts/" + batchId,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const statusText = response.statusText || "";
        let errorMessage = `Failed to fetch receipt: ${response.status}`;

        if (response.status === 404) {
          errorMessage =
            "Receipt API endpoint not found (404). Please check that the backend server is running with the correct routes.";
        } else if (response.status === 401) {
          errorMessage =
            "Authentication failed. Please check your Trumf token.";
        } else if (response.status >= 500) {
          errorMessage =
            "Server error when fetching receipt. Please try again later or check the backend logs.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const receipt = data.receipt;

      if (receipt) {
        // Check if the receipt has processed items or if we need to parse them from varelinjer
        const items = receipt.processed_items || [];

        let receiptHtml = '<div class="receipt-details">';
        receiptHtml += `<h3>Receipt from ${
          receipt.store || receipt.butikkId || "Store"
        }</h3>`;

        // Handle different date format fields
        const receiptDate =
          receipt.date ||
          receipt.transaksjonsTidspunkt ||
          new Date().toISOString();
        receiptHtml += `<p>Date: ${new Date(receiptDate).toLocaleString()}</p>`;

        // Only show items table if we have items
        if (items && items.length > 0) {
          receiptHtml += '<table class="receipt-items">';
          receiptHtml += "<thead>";
          receiptHtml += "<tr>";
          receiptHtml += "<th>Item</th>";
          receiptHtml += "<th>Quantity</th>";
          receiptHtml += "<th>Price</th>";
          receiptHtml += "</tr>";
          receiptHtml += "</thead>";
          receiptHtml += "<tbody>";

          items.forEach((item) => {
            receiptHtml += "<tr>";
            receiptHtml += `<td>${item.name}</td>`;
            receiptHtml += `<td>${item.quantity}</td>`;
            receiptHtml += `<td>NOK ${parseFloat(item.price).toFixed(2)}</td>`;
            receiptHtml += "</tr>";
          });

          receiptHtml += "</tbody>";
          receiptHtml += "</table>";
        } else if (receipt.receipt_data && receipt.receipt_data.varelinjer) {
          // Try to extract and display varelinjer if available
          receiptHtml += '<table class="receipt-items">';
          receiptHtml += "<thead>";
          receiptHtml += "<tr>";
          receiptHtml += "<th>Item</th>";
          receiptHtml += "<th>Quantity</th>";
          receiptHtml += "<th>Price</th>";
          receiptHtml += "</tr>";
          receiptHtml += "</thead>";
          receiptHtml += "<tbody>";

          receipt.receipt_data.varelinjer.forEach((item) => {
            receiptHtml += "<tr>";
            receiptHtml += `<td>${
              item.produktBeskrivelse || "Unknown Product"
            }</td>`;
            receiptHtml += `<td>${item.antall || 1}</td>`;
            receiptHtml += `<td>NOK ${parseFloat(item.belop || 0).toFixed(
              2
            )}</td>`;
            receiptHtml += "</tr>";
          });

          receiptHtml += "</tbody>";
          receiptHtml += "</table>";
        } else {
          receiptHtml +=
            '<p class="info">No item details available for this receipt</p>';
        }

        // Display total amount
        const totalAmount = receipt.total || receipt.belop || 0;
        receiptHtml += `<p class="receipt-total">Total: NOK ${parseFloat(
          totalAmount
        ).toFixed(2)}</p>`;
        receiptHtml += '<button class="back-btn">Back to Transactions</button>';
        receiptHtml += "</div>";

        trumfOutput.innerHTML = receiptHtml;

        // Add back button event listener
        const backBtn = trumfOutput.querySelector(".back-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            // We need to fetch transactions again as we don't have them stored
            const fetchTrumfBtn = document.getElementById("fetchTrumfBtn");
            if (fetchTrumfBtn) {
              fetchTrumfBtn.click();
            }
          });
        }
      } else {
        trumfOutput.innerHTML =
          '<div class="error">No receipt details found</div>';
      }
    } catch (error) {
      trumfOutput.innerHTML = `<div class="error">Error fetching receipt: ${error.message}</div>`;
      console.error("Receipt fetch error:", error);
    }
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

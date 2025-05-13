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

          const response = await fetch("/api/trumf/transactions", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch Trumf data: ${response.status}`);
          }

          const data = await response.json();

          if (trumfOutput) {
            if (data.transactions && data.transactions.length > 0) {
              this.displayTrumfData(data.transactions);
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
          const txnResponse = await fetch("/api/trumf/transactions", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!txnResponse.ok) {
            throw new Error(
              `Failed to fetch Trumf transactions: ${txnResponse.status}`
            );
          }

          const txnData = await txnResponse.json();

          // If we have transactions, fetch a receipt for the first one
          if (txnData.transactions && txnData.transactions.length > 0) {
            const firstTxn = txnData.transactions[0];
            const batchId = firstTxn.batchId || firstTxn.id;

            if (batchId) {
              const receiptResponse = await fetch(
                `/api/trumf/direct-debug/${batchId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!receiptResponse.ok) {
                throw new Error(
                  `Failed to fetch receipt: ${receiptResponse.status}`
                );
              }

              const receiptData = await receiptResponse.json();

              if (trumfOutput) {
                let html = '<div class="debug-result">';
                html += "<h3>Trumf API Debug Results</h3>";

                html += '<div class="debug-section">';
                html += `<p>Successfully retrieved ${txnData.transactions.length} transactions</p>`;

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
      const date = new Date(
        txn.transactionTime || txn.date
      ).toLocaleDateString();
      const store = txn.storeName || "Unknown Store";
      const amount = txn.amount || txn.totalAmount || 0;
      const bonus = txn.bonus || txn.totalBonus || 0;
      const batchId = txn.batchId || txn.id;

      html += "<tr>";
      html += `<td>${date}</td>`;
      html += `<td>${store}</td>`;
      html += `<td>NOK ${amount.toFixed(2)}</td>`;
      html += `<td>NOK ${bonus.toFixed(2)}</td>`;
      html += `<td><button class="view-receipt-btn" data-batch-id="${batchId}">View Receipt</button></td>`;
      html += "</tr>";
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
      const response = await fetch(`/api/trumf/receipts/${batchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch receipt: ${response.status}`);
      }

      const data = await response.json();

      if (data.receipt && data.receipt.items) {
        let receiptHtml = '<div class="receipt-details">';
        receiptHtml += `<h3>Receipt from ${
          data.receipt.storeName || "Store"
        }</h3>`;
        receiptHtml += `<p>Date: ${new Date(
          data.receipt.transactionTime
        ).toLocaleString()}</p>`;

        receiptHtml += '<table class="receipt-items">';
        receiptHtml += "<thead>";
        receiptHtml += "<tr>";
        receiptHtml += "<th>Item</th>";
        receiptHtml += "<th>Quantity</th>";
        receiptHtml += "<th>Price</th>";
        receiptHtml += "</tr>";
        receiptHtml += "</thead>";
        receiptHtml += "<tbody>";

        data.receipt.items.forEach((item) => {
          receiptHtml += "<tr>";
          receiptHtml += `<td>${item.name}</td>`;
          receiptHtml += `<td>${item.quantity}</td>`;
          receiptHtml += `<td>NOK ${item.price.toFixed(2)}</td>`;
          receiptHtml += "</tr>";
        });

        receiptHtml += "</tbody>";
        receiptHtml += "</table>";

        receiptHtml += `<p class="receipt-total">Total: NOK ${data.receipt.totalAmount.toFixed(
          2
        )}</p>`;
        receiptHtml += '<button class="back-btn">Back to Transactions</button>';
        receiptHtml += "</div>";

        trumfOutput.innerHTML = receiptHtml;

        // Add back button event listener
        const backBtn = trumfOutput.querySelector(".back-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            this.displayTrumfData(data.transactions);
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

import { parseCSV, calculateStatistics } from "../assets/js/transactions.js";
import { uploadFile, uploadFileDirect } from "../assets/js/api.js";

class UploadForm {
  constructor() {
    this.fileInput = document.getElementById("fileInput");
    this.uploadBtn = document.getElementById("uploadBtn");
    this.outputSection = document.getElementById("output");
    this.setupEventListeners();
    this.useClientSideProcessing = true; // Set to false to use server-side processing
  }

  setupEventListeners() {
    if (!this.uploadBtn) {
      console.error("Upload button not found");
      return;
    }

    this.uploadBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent form submission if in a form
      this.handleUpload();
    });
  }

  async handleUpload() {
    const file = this.fileInput.files[0];
    if (!file) {
      this.showError("Please select a file to upload");
      return;
    }

    // Validate file type
    const validTypes = [".txt", ".csv", ".xlsx"];
    const fileExt = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!validTypes.includes(fileExt)) {
      this.showError("Please upload a valid file (.txt, .csv, or .xlsx)");
      return;
    }

    this.showLoading();

    // Decide whether to use client-side or server-side processing
    if (
      this.useClientSideProcessing &&
      (fileExt === ".txt" || fileExt === ".csv")
    ) {
      try {
        await this.processFileClientSide(file);
      } catch (error) {
        console.error(
          "Client-side processing failed, falling back to server:",
          error
        );
        await this.processFileServerSide(file);
      }
    } else {
      await this.processFileServerSide(file);
    }
  }

  async processFileClientSide(file) {
    // Read the file content
    const text = await this.readFileAsText(file);

    // Parse the CSV data
    const transactions = parseCSV(text);

    if (!transactions || transactions.length === 0) {
      throw new Error("No transactions found in the file");
    }

    // Calculate statistics
    const stats = calculateStatistics(transactions);

    // Format the data for the dashboard and display
    const data = {
      transactions: transactions.map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        is_expense: t.isExpense,
        category: `${t.category.category}.${t.category.subcategory}`,
        display_category: `${this.formatCategoryName(
          t.category.category
        )} - ${this.formatCategoryName(t.category.subcategory)}`,
        main_category: t.category.mainCategory,
        parent_category: t.category.category,
        subcategory: t.category.subcategory,
      })),
      stats: stats,
    };

    // Display the results
    this.displayResults(data);

    // Trigger event for dashboard/charts to update
    const event = new CustomEvent("transaction-data-updated", {
      detail: data,
    });
    document.dispatchEvent(event);
  }

  async processFileServerSide(file) {
    try {
      this.showLoading();
      console.log(
        `Uploading file ${file.name} of size ${file.size} to server...`
      );

      // First try the direct upload route to test connectivity
      console.log("Trying direct upload route...");
      try {
        const directResult = await uploadFileDirect(file);
        console.log("Direct upload successful:", directResult);

        // Show the file sample
        if (directResult && directResult.sample) {
          console.log("File sample:", directResult.sample);
        }

        // If directResult is successful, proceed with the regular upload route
        console.log("Now trying regular upload route...");
        try {
          const data = await uploadFile(file);
          console.log("Server response:", data);

          // Check for errors
          if (data && data.error) {
            this.showError(`Server error: ${data.error}`);
            return;
          }

          // Call the function to display/visualize the parsed data
          this.displayResults(data);

          // Trigger event for dashboard/charts to update
          const event = new CustomEvent("transaction-data-updated", {
            detail: data,
          });
          document.dispatchEvent(event);
        } catch (uploadError) {
          console.error("Regular upload failed:", uploadError);
          this.showError(`Upload failed: ${uploadError.message}`);
        }
      } catch (directError) {
        console.error("Direct upload failed:", directError);
        this.showError(
          `Direct upload failed: ${directError.message}. Check if server is running and accessible.`
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      this.showError(`Error: ${error.message}`);
    }
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  }

  formatCategoryName(category) {
    if (!category) return "Uncategorized";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  showLoading() {
    this.outputSection.innerHTML =
      '<div class="loading">Processing your file...</div>';
  }

  showError(message) {
    this.outputSection.innerHTML = `<div class="error">${message}</div>`;
  }

  displayResults(data) {
    if (data.error) {
      this.showError(data.error);
      return;
    }

    const { transactions, stats } = data;

    // Display summary
    let html = `
      <div class="results-summary">
        <h3>Summary</h3>
        <div class="summary-cards">
          <div class="summary-card income">
            <h4>Income</h4>
            <div class="amount">NOK ${stats.income.total.toFixed(2)}</div>
          </div>
          <div class="summary-card expenses">
            <h4>Expenses</h4>
            <div class="amount">NOK ${stats.expenses.total.toFixed(2)}</div>
          </div>
          <div class="summary-card balance ${
            stats.income.total - stats.expenses.total >= 0
              ? "positive"
              : "negative"
          }">
            <h4>Balance</h4>
            <div class="amount">NOK ${(
              stats.income.total - stats.expenses.total
            ).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="transaction-table">
        <h3>Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Add transaction rows
    transactions.forEach((transaction) => {
      const amountClass = transaction.is_expense ? "expense" : "income";
      html += `
        <tr>
          <td>${transaction.date}</td>
          <td>${transaction.description}</td>
          <td>${transaction.display_category}</td>
          <td class="${amountClass}">${
        transaction.is_expense ? "-" : "+"
      } NOK ${Math.abs(transaction.amount).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    this.outputSection.innerHTML = html;
  }
}

// Export the class
export default UploadForm;

class TransactionList {
  constructor(containerId = "transaction-list") {
    this.container = document.getElementById(containerId);
    this.transactions = [];
    this.filters = {
      category: "all",
      dateFrom: null,
      dateTo: null,
      searchTerm: "",
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("transaction-data-updated", (event) => {
      this.updateTransactions(event.detail.transactions);
    });
  }

  updateTransactions(transactions) {
    this.transactions = transactions;
    this.render();
  }

  applyFilters() {
    return this.transactions.filter((transaction) => {
      // Category filter
      if (
        this.filters.category !== "all" &&
        transaction.main_category !== this.filters.category &&
        transaction.parent_category !== this.filters.category &&
        transaction.subcategory !== this.filters.category
      ) {
        return false;
      }

      // Date range filter
      if (this.filters.dateFrom) {
        const transactionDate = new Date(transaction.date);
        const fromDate = new Date(this.filters.dateFrom);
        if (transactionDate < fromDate) return false;
      }

      if (this.filters.dateTo) {
        const transactionDate = new Date(transaction.date);
        const toDate = new Date(this.filters.dateTo);
        if (transactionDate > toDate) return false;
      }

      // Search term filter
      if (this.filters.searchTerm) {
        const searchTerm = this.filters.searchTerm.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(searchTerm) ||
          transaction.display_category.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  }

  createFilterControls() {
    const uniqueCategories = [
      ...new Set(
        this.transactions
          .map((t) => t.main_category)
          .concat(this.transactions.map((t) => t.parent_category))
          .concat(this.transactions.map((t) => t.subcategory))
      ),
    ].sort();

    let html = `
      <div class="filter-controls">
        <div class="filter-group">
          <label for="category-filter">Category:</label>
          <select id="category-filter">
            <option value="all">All Categories</option>
    `;

    uniqueCategories.forEach((category) => {
      html += `<option value="${category}">${
        category.charAt(0).toUpperCase() + category.slice(1)
      }</option>`;
    });

    html += `
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-from">From:</label>
          <input type="date" id="date-from">
        </div>
        
        <div class="filter-group">
          <label for="date-to">To:</label>
          <input type="date" id="date-to">
        </div>
        
        <div class="filter-group">
          <label for="search-term">Search:</label>
          <input type="text" id="search-term" placeholder="Search description or category">
        </div>
        
        <button id="apply-filters" class="primary-btn">Apply Filters</button>
        <button id="reset-filters" class="secondary-btn">Reset</button>
      </div>
    `;

    return html;
  }

  render() {
    if (!this.container) return;

    if (this.transactions.length === 0) {
      this.container.innerHTML =
        "<p>No transactions available. Please upload a file.</p>";
      return;
    }

    const filteredTransactions = this.applyFilters();

    let html = this.createFilterControls();

    html += `
      <div class="transaction-table">
        <h3>Filtered Transactions (${filteredTransactions.length})</h3>
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

    filteredTransactions.forEach((transaction) => {
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

    this.container.innerHTML = html;

    // Add event listeners to the filter controls
    document
      .getElementById("category-filter")
      .addEventListener("change", (e) => {
        this.filters.category = e.target.value;
      });

    document.getElementById("date-from").addEventListener("change", (e) => {
      this.filters.dateFrom = e.target.value;
    });

    document.getElementById("date-to").addEventListener("change", (e) => {
      this.filters.dateTo = e.target.value;
    });

    document.getElementById("search-term").addEventListener("input", (e) => {
      this.filters.searchTerm = e.target.value;
    });

    document.getElementById("apply-filters").addEventListener("click", () => {
      this.render();
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
      this.filters = {
        category: "all",
        dateFrom: null,
        dateTo: null,
        searchTerm: "",
      };

      // Reset form values
      document.getElementById("category-filter").value = "all";
      document.getElementById("date-from").value = "";
      document.getElementById("date-to").value = "";
      document.getElementById("search-term").value = "";

      this.render();
    });
  }
}

export default TransactionList;

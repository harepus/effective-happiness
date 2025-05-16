import PieChart from "./charts/pie-chart.js";
import BarChart from "./charts/bar-chart.js";
import LineChart from "./charts/line-chart.js";
import CalendarView from "./charts/calendar.js";

class Dashboard {
  constructor() {
    this.pieChart = null;
    this.barChart = null;
    this.lineChart = null;
    this.data = null;
    this.initialized = false;

    // Create containers for the charts in a structured layout
    this.createChartContainers();
    this.calendarView = null;

    this.setupEventListeners();
    this.initializeCharts();

    // Add window unload handler to clean up charts
    window.addEventListener("beforeunload", () => this.cleanup());

    // Add resize handler to properly resize charts
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  initializeCharts() {
    // Only initialize once
    if (this.initialized) {
      return;
    }

    try {
      this.pieChart = new PieChart("pieChart");
      this.barChart = new BarChart("barChart");
      this.lineChart = new LineChart("lineChart");
      this.calendarView = new CalendarView("calendar-view");
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing charts:", error);
    }
  }

  createChartContainers() {
    // Get or create the dashboard container
    let dashboardSection = document.querySelector(".dashboard");

    if (!dashboardSection) {
      dashboardSection = document.createElement("div");
      dashboardSection.className = "dashboard";
      document.querySelector(".container").appendChild(dashboardSection);
    }

    // Clear any existing content
    dashboardSection.innerHTML = "";

    // Set grid layout for dashboard charts
    dashboardSection.style.display = "grid";
    dashboardSection.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(300px, 1fr))";
    dashboardSection.style.gap = "20px";
    dashboardSection.style.marginBottom = "30px";

    // Create containers for each chart type - make them smaller
    const pieChartContainer = this.createChartContainer(
      dashboardSection,
      "Spending by Category",
      "pieChart"
    );

    const barChartContainer = this.createChartContainer(
      dashboardSection,
      "Daily Expenses",
      "barChart"
    );

    const lineChartContainer = this.createChartContainer(
      dashboardSection,
      "Monthly Income vs. Expenses",
      "lineChart"
    );

    // Apply sizing to chart containers
    [pieChartContainer, barChartContainer, lineChartContainer].forEach(
      (container) => {
        container.style.minHeight = "280px";
        container.style.height = "auto";

        // Make canvas smaller
        const canvas = container.querySelector("canvas");
        if (canvas) {
          canvas.style.height = "180px";
          canvas.height = 180;
        }
      }
    );

    // Create calendar and summary section in a flex layout
    const calendarRow = document.createElement("div");
    calendarRow.className = "calendar-summary-row";
    calendarRow.style.width = "100%";
    calendarRow.style.marginTop = "20px";
    calendarRow.style.clear = "both";
    calendarRow.style.display = "flex";
    calendarRow.style.gap = "20px";
    calendarRow.style.marginBottom = "30px";

    // Create calendar container with reduced width
    const calendarContainer = document.createElement("div");
    calendarContainer.className = "chart-container calendar-container";
    calendarContainer.style.flex = "3"; // Take 75% of the available space
    calendarContainer.style.marginBottom = "0";
    calendarContainer.style.minHeight = "auto";
    calendarContainer.style.background = "var(--card-bg)";
    calendarContainer.style.padding = "15px";
    calendarContainer.style.borderRadius = "8px";
    calendarContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    calendarContainer.innerHTML = `
      <h2>Daily Expense Calendar</h2>
      <div id="calendar-view"></div>
    `;

    // Create summary container with vertical layout
    const summaryContainer = document.createElement("div");
    summaryContainer.className = "summary-container";
    summaryContainer.style.flex = "1"; // Take 25% of the available space
    summaryContainer.style.display = "flex";
    summaryContainer.style.flexDirection = "column";
    summaryContainer.style.gap = "15px";
    summaryContainer.style.maxWidth = "300px";
    summaryContainer.style.background = "var(--card-bg)";
    summaryContainer.style.padding = "15px";
    summaryContainer.style.borderRadius = "8px";
    summaryContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";

    // Create summary header
    const summaryHeader = document.createElement("h2");
    summaryHeader.textContent = "Summary";
    summaryHeader.style.marginBottom = "10px";
    summaryHeader.style.textAlign = "center";
    summaryContainer.appendChild(summaryHeader);

    // Create income card
    const incomeCard = document.createElement("div");
    incomeCard.className = "summary-card income";
    incomeCard.style.flex = "1";
    incomeCard.style.padding = "20px";
    incomeCard.style.borderRadius = "8px";
    incomeCard.style.textAlign = "center";
    incomeCard.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
    incomeCard.style.backgroundColor = "#e3f2fd";
    incomeCard.style.display = "flex";
    incomeCard.style.flexDirection = "column";
    incomeCard.style.justifyContent = "center";
    incomeCard.style.minHeight = "80px";
    incomeCard.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";

    const incomeHeader = document.createElement("h4");
    incomeHeader.textContent = "Income";
    incomeHeader.style.marginTop = "0";
    incomeHeader.style.marginBottom = "10px";
    incomeHeader.style.fontSize = "1.1rem";

    const incomeAmount = document.createElement("p");
    incomeAmount.className = "amount";
    incomeAmount.id = "income-amount";
    incomeAmount.textContent = "NOK 0.00";
    incomeAmount.style.fontSize = "1.7rem";
    incomeAmount.style.fontWeight = "bold";
    incomeAmount.style.margin = "0";
    incomeAmount.style.color = "#0d6efd";

    incomeCard.appendChild(incomeHeader);
    incomeCard.appendChild(incomeAmount);
    summaryContainer.appendChild(incomeCard);

    // Create expenses card
    const expensesCard = document.createElement("div");
    expensesCard.className = "summary-card expenses";
    expensesCard.style.flex = "1";
    expensesCard.style.padding = "20px";
    expensesCard.style.borderRadius = "8px";
    expensesCard.style.textAlign = "center";
    expensesCard.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
    expensesCard.style.backgroundColor = "#fff5f5";
    expensesCard.style.display = "flex";
    expensesCard.style.flexDirection = "column";
    expensesCard.style.justifyContent = "center";
    expensesCard.style.minHeight = "80px";
    expensesCard.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";

    const expensesHeader = document.createElement("h4");
    expensesHeader.textContent = "Expenses";
    expensesHeader.style.marginTop = "0";
    expensesHeader.style.marginBottom = "10px";
    expensesHeader.style.fontSize = "1.1rem";

    const expensesAmount = document.createElement("p");
    expensesAmount.className = "amount";
    expensesAmount.id = "expenses-amount";
    expensesAmount.textContent = "NOK 0.00";
    expensesAmount.style.fontSize = "1.7rem";
    expensesAmount.style.fontWeight = "bold";
    expensesAmount.style.margin = "0";
    expensesAmount.style.color = "#dc3545";

    expensesCard.appendChild(expensesHeader);
    expensesCard.appendChild(expensesAmount);
    summaryContainer.appendChild(expensesCard);

    // Create balance card
    const balanceCard = document.createElement("div");
    balanceCard.className = "summary-card balance";
    balanceCard.style.flex = "1";
    balanceCard.style.padding = "20px";
    balanceCard.style.borderRadius = "8px";
    balanceCard.style.textAlign = "center";
    balanceCard.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
    balanceCard.style.backgroundColor = "#f1f8e9";
    balanceCard.style.display = "flex";
    balanceCard.style.flexDirection = "column";
    balanceCard.style.justifyContent = "center";
    balanceCard.style.minHeight = "80px";
    balanceCard.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";

    const balanceHeader = document.createElement("h4");
    balanceHeader.textContent = "Balance";
    balanceHeader.style.marginTop = "0";
    balanceHeader.style.marginBottom = "10px";
    balanceHeader.style.fontSize = "1.1rem";

    const balanceAmount = document.createElement("p");
    balanceAmount.className = "amount";
    balanceAmount.id = "balance-amount";
    balanceAmount.textContent = "NOK 0.00";
    balanceAmount.style.fontSize = "1.7rem";
    balanceAmount.style.fontWeight = "bold";
    balanceAmount.style.margin = "0";

    balanceCard.appendChild(balanceHeader);
    balanceCard.appendChild(balanceAmount);
    summaryContainer.appendChild(balanceCard);

    calendarRow.appendChild(calendarContainer);
    calendarRow.appendChild(summaryContainer);

    // Add media query functionality for responsive layout
    const handleResize = () => {
      if (window.innerWidth < 992) {
        calendarRow.style.flexDirection = "column";
        calendarContainer.style.flex = "1 1 100%";
        summaryContainer.style.flex = "1 1 100%";
        summaryContainer.style.maxWidth = "none";
        summaryContainer.style.marginTop = "20px";
      } else {
        calendarRow.style.flexDirection = "row";
        calendarContainer.style.flex = "3";
        summaryContainer.style.flex = "1";
        summaryContainer.style.maxWidth = "300px";
        summaryContainer.style.marginTop = "0";
      }
    };

    // Initial call and event listener
    handleResize();
    window.addEventListener("resize", handleResize);

    // Insert the calendar row before the output section
    const outputSection = document.querySelector(".output-section");
    if (outputSection) {
      document
        .querySelector(".container")
        .insertBefore(calendarRow, outputSection);
    } else {
      document.querySelector(".container").appendChild(calendarRow);
    }
  }

  createChartContainer(parent, title, id) {
    const container = document.createElement("div");
    container.className = "chart-container";
    container.style.background = "var(--card-bg)";
    container.style.padding = "15px";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
    container.style.position = "relative";
    container.style.boxSizing = "border-box";
    container.style.marginBottom = "20px";

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.fontSize = "1.4rem";
    heading.style.marginBottom = "10px";

    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.style.width = "100%";
    canvas.style.height = "180px";
    canvas.style.maxHeight = "180px";
    canvas.style.display = "block";
    canvas.style.boxSizing = "border-box";
    canvas.style.margin = "0";
    canvas.style.padding = "0";

    container.appendChild(heading);
    container.appendChild(canvas);
    parent.appendChild(container);

    return container;
  }

  setupEventListeners() {
    document.addEventListener("transaction-data-updated", (event) => {
      this.updateData(event.detail);
    });
  }

  handleResize() {
    // Throttle resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      if (this.initialized) {
        // Refresh charts on resize
        if (this.pieChart && this.pieChart.chart) this.pieChart.chart.resize();
        if (this.barChart && this.barChart.chart) this.barChart.chart.resize();
        if (this.lineChart && this.lineChart.chart)
          this.lineChart.chart.resize();
      }
    }, 250);
  }

  updateData(data) {
    // Ensure charts are initialized
    if (!this.initialized) {
      this.initializeCharts();
    }

    // Store the data but don't update charts if we already have similar data
    if (
      this.data &&
      JSON.stringify(this.data.stats?.monthly_summary) ===
        JSON.stringify(data.stats?.monthly_summary) &&
      JSON.stringify(this.data.stats?.daily_expenses) ===
        JSON.stringify(data.stats?.daily_expenses)
    ) {
      console.log("Skipping chart update - data hasn't changed");
      return;
    }

    this.data = data;
    this.updateCharts();
    this.updateSummary();
  }

  updateCharts() {
    if (!this.data) return;

    const { stats } = this.data;

    // Use a try-catch to prevent errors from breaking the entire dashboard
    try {
      // Update pie chart - spending by category
      const expenseCategories = Object.entries(stats.expenses.categories)
        .map(([category, amount]) => ({
          label:
            category.charAt(0).toUpperCase() +
            category.slice(1).replace("_", " "),
          value: Math.abs(amount),
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

      this.pieChart.update({
        labels: expenseCategories.map((cat) => cat.label),
        values: expenseCategories.map((cat) => cat.value),
        title: "Spending by Category",
        subtitle: `Total: NOK ${stats.expenses.total.toFixed(2)}`,
      });

      // Update bar chart - daily expenses
      const dailyExpenses = stats.daily_expenses || {};
      const sortedDays = Object.keys(dailyExpenses).sort();

      this.barChart.update({
        labels: sortedDays,
        values: sortedDays.map((day) => Math.abs(dailyExpenses[day] || 0)),
        title: "Daily Expenses",
        subtitle: "Spending by day of month",
        xLabel: "Date",
        yLabel: "Amount (NOK)",
      });

      // Update line chart - income vs expenses by month
      const monthlySummary = stats.monthly_summary || {};
      const months = Object.keys(monthlySummary).sort();

      const incomeData = months.map(
        (month) => monthlySummary[month]?.income || 0
      );

      const expenseData = months.map((month) =>
        Math.abs(monthlySummary[month]?.expenses || 0)
      );

      // Check if we have any income or expense data
      const hasData =
        incomeData.some((val) => val > 0) || expenseData.some((val) => val > 0);

      if (hasData) {
        // Find the maximum value to set an appropriate Y-axis scale
        const maxValue = Math.max(
          Math.max(...incomeData, 0),
          Math.max(...expenseData, 0)
        );

        // Set a reasonable suggestedMax value based on the data
        const suggestedMax = Math.ceil((maxValue * 1.2) / 5000) * 5000;

        this.lineChart.update({
          labels: months,
          datasets: [
            {
              label: "Income",
              data: incomeData,
              color: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgb(75, 192, 192)",
            },
            {
              label: "Expenses",
              data: expenseData,
              color: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgb(255, 99, 132)",
            },
          ],
          title: "Monthly Income vs. Expenses",
          xLabel: "Month",
          yLabel: "Amount (NOK)",
          suggestedMax: suggestedMax > 0 ? suggestedMax : undefined,
        });
      }

      // Update calendar view if it exists
      if (this.calendarView) {
        // Calendar view will update itself via event listener
        // or we can trigger an update here if needed
      }
    } catch (error) {
      console.error("Error updating charts:", error);
    }
  }

  // Update the summary section with the latest data
  updateSummary() {
    if (!this.data || !this.data.stats) return;

    const { stats } = this.data;
    const income = stats.income?.total || 0;
    const expenses = Math.abs(stats.expenses?.total || 0);
    const balance = income - expenses;

    // Update summary cards
    const incomeAmount = document.getElementById("income-amount");
    if (incomeAmount) {
      incomeAmount.textContent = `NOK ${income.toFixed(2)}`;
    }

    const expensesAmount = document.getElementById("expenses-amount");
    if (expensesAmount) {
      expensesAmount.textContent = `NOK ${expenses.toFixed(2)}`;
    }

    const balanceAmount = document.getElementById("balance-amount");
    if (balanceAmount) {
      balanceAmount.textContent = `NOK ${balance.toFixed(2)}`;
      balanceAmount.style.color = balance >= 0 ? "#28a745" : "#dc3545";

      // Update balance card class based on positive/negative value
      const balanceCard = balanceAmount.closest(".summary-card.balance");
      if (balanceCard) {
        if (balance >= 0) {
          balanceCard.classList.remove("negative");
          balanceCard.classList.add("positive");
        } else {
          balanceCard.classList.remove("positive");
          balanceCard.classList.add("negative");
        }
      }
    }
  }

  // Method to handle Nordnet investment data specifically
  updateInvestmentData(investmentData) {
    if (!investmentData) return;

    // Implement special handling for investment visualization
    console.log("Investment data received:", investmentData);
    // Here you would add specialized charts for investments
  }

  cleanup() {
    // Clean up all charts to prevent memory leaks
    if (this.pieChart && this.pieChart.cleanup) this.pieChart.cleanup();
    if (this.barChart && this.barChart.cleanup) this.barChart.cleanup();
    if (this.lineChart && this.lineChart.cleanup) this.lineChart.cleanup();
    if (this.calendarView && this.calendarView.cleanup)
      this.calendarView.cleanup();

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize.bind(this));
  }
}

export default Dashboard;

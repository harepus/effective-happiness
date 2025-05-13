import PieChart from "./charts/pie-chart.js";
import BarChart from "./charts/bar-chart.js";
import LineChart from "./charts/line-chart.js";
import CalendarView from "./charts/calendar.js";

class Dashboard {
  constructor() {
    this.pieChart = new PieChart("pieChart");
    this.barChart = new BarChart("barChart");
    this.lineChart = new LineChart("lineChart");
    this.data = null;

    // Create a container for the calendar view
    this.createCalendarContainer();
    this.calendarView = new CalendarView("calendar-view");

    this.setupEventListeners();
  }

  createCalendarContainer() {
    // Create a container for the calendar if it doesn't exist
    if (!document.getElementById("calendar-view")) {
      const chartSection = document.querySelector(".dashboard");

      if (chartSection) {
        const calendarContainer = document.createElement("div");
        calendarContainer.className = "chart-container";
        calendarContainer.innerHTML = `
          <h2>Daily Expense Calendar</h2>
          <div id="calendar-view"></div>
        `;

        chartSection.appendChild(calendarContainer);
      }
    }
  }

  setupEventListeners() {
    document.addEventListener("transaction-data-updated", (event) => {
      this.updateData(event.detail);
    });
  }

  updateData(data) {
    this.data = data;
    this.updateCharts();
  }

  updateCharts() {
    if (!this.data) return;

    const { stats } = this.data;

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
    });

    // Calendar view will update itself via event listener
  }

  // Method to handle Nordnet investment data specifically
  updateInvestmentData(investmentData) {
    if (!investmentData) return;

    // Implement special handling for investment visualization
    console.log("Investment data received:", investmentData);
    // Here you would add specialized charts for investments
  }
}

export default Dashboard;

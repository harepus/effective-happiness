function createPieChart(elementId, data) {
  const ctx = document.getElementById(elementId).getContext("2d");
  return new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Expenses by Category",
          data: Object.values(data),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#C9CBCF",
            "#7BC043",
            "#58508d",
            "#bc5090",
            "#ff6361",
            "#ffa600",
          ],
          borderWidth: 1,
        },
      ],
    },
  });
}

function createBarChart(elementId, data) {
  const ctx = document.getElementById(elementId).getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Daily Expenses",
          data: Object.values(data),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function createLineChart(elementId, incomeData, expenseData) {
  const ctx = document.getElementById(elementId).getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(incomeData),
      datasets: [
        {
          label: "Income",
          data: Object.values(incomeData),
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: true,
        },
        {
          label: "Expenses",
          data: Object.values(expenseData),
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: true,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

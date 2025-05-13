function createPieChart(elementId, data, options = {}) {
  const ctx = document.getElementById(elementId).getContext("2d");

  // Sort categories by amount (descending)
  const sortedData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedData.map(([label, _]) => label);
  const values = sortedData.map(([_, value]) => value);

  // Generate color palette
  const colors = generateColorPalette(sortedData.length);

  return new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: options.legendPosition || "right",
          align: "start",
          labels: {
            boxWidth: 15,
            padding: 15,
            usePointStyle: true,
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const total = data.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(1);

                  return {
                    text: `${label}: ${percentage}% (${value.toFixed(2)} kr)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor[i],
                    lineWidth: data.datasets[0].borderWidth,
                    hidden:
                      isNaN(data.datasets[0].data[i]) ||
                      chart.getDataVisibility(i),
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value.toFixed(2)} kr (${percentage}%)`;
            },
          },
        },
      },
      ...options,
    },
  });
}

function createBarChart(elementId, data, options = {}) {
  const ctx = document.getElementById(elementId).getContext("2d");

  // Set defaults
  const chartOptions = {
    xAxisTitle: options.xAxisTitle || "",
    yAxisTitle: options.yAxisTitle || "Amount (kr)",
    barColor: options.barColor || "rgba(75, 110, 181, 0.7)",
    barBorderColor: options.barBorderColor || "rgba(75, 110, 181, 1)",
    ...options,
  };

  // Sort data if requested
  let labels = Object.keys(data);
  let values = Object.values(data);

  if (options.sortData) {
    const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    labels = sortedEntries.map(([key, _]) => key);
    values = sortedEntries.map(([_, value]) => value);
  }

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: options.label || "Amount",
          data: values,
          backgroundColor: chartOptions.barColor,
          borderColor: chartOptions.barBorderColor,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: !!chartOptions.xAxisTitle,
            text: chartOptions.xAxisTitle,
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: !!chartOptions.yAxisTitle,
            text: chartOptions.yAxisTitle,
          },
          ticks: {
            callback: function (value) {
              return value + " kr";
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw.toFixed(2)} kr`;
            },
          },
        },
        ...options.plugins,
      },
    },
  });
}

function createLineChart(elementId, incomeData, expenseData, options = {}) {
  const ctx = document.getElementById(elementId).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(incomeData),
      datasets: [
        {
          label: "Income",
          data: Object.values(incomeData),
          borderColor: "rgba(46, 204, 113, 1)",
          backgroundColor: "rgba(46, 204, 113, 0.2)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Expenses",
          data: Object.values(expenseData),
          borderColor: "rgba(231, 76, 60, 1)",
          backgroundColor: "rgba(231, 76, 60, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw;
              return `${label}: ${value.toFixed(2)} kr`;
            },
          },
        },
      },
      ...options,
    },
  });
}

// Helper function to generate a nice color palette
function generateColorPalette(count) {
  const baseColors = [
    "#4A6EB5", // primary blue
    "#E67E22", // accent orange
    "#2ECC71", // green
    "#E74C3C", // red
    "#9B59B6", // purple
    "#3498DB", // light blue
    "#F1C40F", // yellow
    "#1ABC9C", // teal
    "#D35400", // dark orange
    "#C0392B", // dark red
    "#8E44AD", // dark purple
    "#16A085", // dark teal
    "#27AE60", // dark green
    "#2980B9", // dark blue
    "#F39C12", // gold
  ];

  // If we need more colors than our base palette
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  } else {
    // Create additional colors by adjusting opacity
    const result = [...baseColors];
    const iterations = Math.ceil(count / baseColors.length) - 1;

    for (let i = 0; i < iterations; i++) {
      const opacity = 0.8 - i * 0.2;
      const newColors = baseColors.map((color) => {
        const rgb = hexToRgb(color);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      });
      result.push(...newColors);
    }

    return result.slice(0, count);
  }
}

// Helper to convert hex color to RGB
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

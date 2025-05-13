class BarChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.initialize();
  }

  initialize() {
    if (!this.canvas) {
      console.error("Canvas element not found");
      return;
    }

    const ctx = this.canvas.getContext("2d");

    // Initialize with empty data
    this.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Daily Expenses",
            data: [],
            backgroundColor: "rgba(255, 99, 132, 0.7)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Amount (NOK)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Daily Expenses",
            font: {
              size: 16,
            },
          },
          subtitle: {
            display: true,
            text: "Upload data to see daily expenses",
            font: {
              size: 12,
              style: "italic",
            },
            padding: {
              bottom: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                return `NOK ${value.toFixed(2)}`;
              },
            },
          },
        },
      },
    });
  }

  update(data) {
    if (!this.chart) {
      this.initialize();
      if (!this.chart) return;
    }

    const { labels, values, title, subtitle, xLabel, yLabel } = data;

    // Format the labels for better display
    const formattedLabels = labels.map((label) => {
      // If it's a date string like YYYY-MM-DD, format to DD
      if (label.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return label.split("-")[2]; // Extract day
      }
      return label;
    });

    // Update chart data
    this.chart.data.labels = formattedLabels;
    this.chart.data.datasets[0].data = values;

    // Update chart options
    if (title) {
      this.chart.options.plugins.title.text = title;
    }

    if (subtitle) {
      this.chart.options.plugins.subtitle.display = true;
      this.chart.options.plugins.subtitle.text = subtitle;
    } else {
      this.chart.options.plugins.subtitle.display = false;
    }

    if (xLabel) {
      this.chart.options.scales.x.title.text = xLabel;
    }

    if (yLabel) {
      this.chart.options.scales.y.title.text = yLabel;
    }

    this.chart.update();
  }

  // Method to update chart appearance
  updateAppearance(options) {
    if (!this.chart) return;

    const { barColor, borderColor } = options;

    if (barColor) {
      this.chart.data.datasets[0].backgroundColor = barColor;
    }

    if (borderColor) {
      this.chart.data.datasets[0].borderColor = borderColor;
    }

    this.chart.update();
  }
}

export default BarChart;

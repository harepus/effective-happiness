class LineChart {
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
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Income",
            data: [],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            fill: true,
            tension: 0.1,
          },
          {
            label: "Expenses",
            data: [],
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 2,
            fill: true,
            tension: 0.1,
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
              text: "Month",
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Monthly Income vs. Expenses",
            font: {
              size: 16,
            },
          },
          subtitle: {
            display: true,
            text: "Upload data to see monthly trends",
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
                const label = context.dataset.label || "";
                const value = context.parsed.y;
                return `${label}: NOK ${value.toFixed(2)}`;
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

    const { labels, datasets, title, subtitle, xLabel, yLabel } = data;

    // Format the labels for better display
    const formattedLabels = labels.map((label) => {
      // If it's a YYYY-MM format, convert to MMM YYYY
      if (label.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = label.split("-");
        const date = new Date(year, month - 1);
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }
      return label;
    });

    // Update chart data
    this.chart.data.labels = formattedLabels;

    // Update datasets
    if (datasets && datasets.length > 0) {
      this.chart.data.datasets = datasets.map((dataset, index) => {
        // If the dataset already exists, keep its non-specified properties
        const existingDataset = this.chart.data.datasets[index] || {};

        return {
          ...existingDataset,
          label:
            dataset.label || existingDataset.label || `Dataset ${index + 1}`,
          data: dataset.data || [],
          backgroundColor: dataset.color || existingDataset.backgroundColor,
          borderColor: dataset.borderColor || existingDataset.borderColor,
          fill:
            dataset.fill === undefined
              ? existingDataset.fill || true
              : dataset.fill,
          tension:
            dataset.tension === undefined
              ? existingDataset.tension || 0.1
              : dataset.tension,
        };
      });
    }

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

  // Add stacked area under the lines
  enableAreaFill(enable = true) {
    if (!this.chart) return;

    this.chart.data.datasets.forEach((dataset) => {
      dataset.fill = enable;
    });

    this.chart.update();
  }
}

export default LineChart;

class LineChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.resizeObserver = null;
    this.initialize();
  }

  initialize() {
    if (!this.canvas) {
      console.error("Canvas element not found");
      return;
    }

    // Destroy any existing chart to prevent memory leaks
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Set up the resize observer
    this.setupResizeObserver();

    // Set fixed dimensions for the canvas
    this.canvas.style.height = "180px";
    this.canvas.height = 180;
    this.canvas.style.width = "100%";

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    try {
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
          animation: {
            duration: 0, // Disable animations to prevent growth
          },
          layout: {
            padding: {
              top: 5,
              right: 8,
              bottom: 8,
              left: 8,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Amount (NOK)",
                font: {
                  size: 11,
                },
              },
              suggestedMax: 15000,
              padding: 8,
              ticks: {
                font: {
                  size: 10,
                },
              },
            },
            x: {
              title: {
                display: true,
                text: "Month",
                font: {
                  size: 11,
                },
              },
              padding: 8,
              ticks: {
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                font: {
                  size: 11,
                },
                padding: 8,
              },
            },
            title: {
              display: true,
              text: "Monthly Income vs. Expenses",
              font: {
                size: 14,
              },
            },
            subtitle: {
              display: true,
              text: "Upload data to see monthly trends",
              font: {
                size: 11,
                style: "italic",
              },
              padding: {
                bottom: 8,
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
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }

  setupResizeObserver() {
    // Clean up any existing observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Add resize observer to handle container resizing
    if (this.canvas && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(this.canvas.parentNode);
    }
  }

  resize() {
    if (this.chart) {
      try {
        this.chart.resize();
      } catch (error) {
        console.error("Error resizing chart:", error);
      }
    }
  }

  update(data) {
    if (!this.chart) {
      this.initialize();
      if (!this.chart) return;
    }

    try {
      const {
        labels,
        datasets,
        title,
        subtitle,
        xLabel,
        yLabel,
        suggestedMax,
      } = data;

      // Check if we have valid data
      if (!labels || !labels.length || !datasets || !datasets.length) {
        console.warn("Invalid data provided to line chart");
        return;
      }

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

      // Update Y-axis scale if suggestedMax is provided
      if (suggestedMax !== undefined) {
        this.chart.options.scales.y.suggestedMax = suggestedMax;
      }

      this.chart.update();
    } catch (error) {
      console.error("Error updating chart:", error);
    }
  }

  // Add stacked area under the lines
  enableAreaFill(enable = true) {
    if (!this.chart) return;

    try {
      this.chart.data.datasets.forEach((dataset) => {
        dataset.fill = enable;
      });

      this.chart.update();
    } catch (error) {
      console.error("Error updating area fill:", error);
    }
  }

  // Add a cleanup method to disconnect the observer when needed
  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

export default LineChart;

class BarChart {
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
          animation: {
            duration: 0, // Disable animations to prevent growth
          },
          layout: {
            padding: {
              top: 5,
              right: 10,
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
              suggestedMax: 2000,
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
                text: "Date",
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
              display: false,
            },
            title: {
              display: true,
              text: "Daily Expenses",
              font: {
                size: 14,
              },
            },
            subtitle: {
              display: true,
              text: "Upload data to see daily expenses",
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
                  const value = context.parsed.y;
                  return `NOK ${value.toFixed(2)}`;
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

      // Adjust Y-axis scale based on data
      const maxValue = Math.max(...values, 0);
      const suggestedMax = Math.ceil((maxValue * 1.2) / 500) * 500;
      if (suggestedMax > 0) {
        this.chart.options.scales.y.suggestedMax = suggestedMax;
      }

      this.chart.update();
    } catch (error) {
      console.error("Error updating chart:", error);
    }
  }

  // Method to update chart appearance
  updateAppearance(options) {
    if (!this.chart) return;

    try {
      const { barColor, borderColor } = options;

      if (barColor) {
        this.chart.data.datasets[0].backgroundColor = barColor;
      }

      if (borderColor) {
        this.chart.data.datasets[0].borderColor = borderColor;
      }

      this.chart.update();
    } catch (error) {
      console.error("Error updating chart appearance:", error);
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

export default BarChart;

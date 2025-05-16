class PieChart {
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

    // Define a color palette for the chart
    this.colorPalette = [
      "rgba(255, 99, 132, 0.8)",
      "rgba(54, 162, 235, 0.8)",
      "rgba(255, 206, 86, 0.8)",
      "rgba(75, 192, 192, 0.8)",
      "rgba(153, 102, 255, 0.8)",
      "rgba(255, 159, 64, 0.8)",
      "rgba(199, 199, 199, 0.8)",
      "rgba(83, 102, 255, 0.8)",
      "rgba(40, 159, 64, 0.8)",
      "rgba(210, 199, 199, 0.8)",
      "rgba(78, 52, 199, 0.8)",
      "rgba(200, 22, 64, 0.8)",
    ];

    try {
      // Initialize with empty data
      this.chart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: this.colorPalette,
              borderColor: this.colorPalette.map((color) =>
                color.replace("0.8", "1")
              ),
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
          plugins: {
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 11,
                },
                padding: 8,
              },
            },
            title: {
              display: true,
              text: "Spending by Category",
              font: {
                size: 14,
              },
            },
            subtitle: {
              display: true,
              text: "Upload data to see categories",
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
                  const value = context.parsed;
                  const label = context.label || "";
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: NOK ${value.toFixed(2)} (${percentage}%)`;
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
      const { labels, values, title, subtitle } = data;

      // Ensure we have enough colors for all categories
      const backgroundColor = [];
      const borderColor = [];

      for (let i = 0; i < labels.length; i++) {
        const colorIndex = i % this.colorPalette.length;
        backgroundColor.push(this.colorPalette[colorIndex]);
        borderColor.push(this.colorPalette[colorIndex].replace("0.8", "1"));
      }

      // Update chart data
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.data.datasets[0].backgroundColor = backgroundColor;
      this.chart.data.datasets[0].borderColor = borderColor;

      // Update chart options
      this.chart.options.plugins.title.text = title || "Spending by Category";

      if (subtitle) {
        this.chart.options.plugins.subtitle.display = true;
        this.chart.options.plugins.subtitle.text = subtitle;
      } else {
        this.chart.options.plugins.subtitle.display = false;
      }

      this.chart.update();
    } catch (error) {
      console.error("Error updating chart:", error);
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

export default PieChart;

class CalendarView {
  constructor(containerId = "calendar-view") {
    this.container = document.getElementById(containerId);
    this.data = {};
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();

    if (this.container) {
      this.initialize();
    }
  }

  initialize() {
    // Add custom styles to container
    if (this.container && this.container.parentElement) {
      this.container.parentElement.style.minHeight = "auto";
      this.container.style.maxHeight = "400px";
      this.container.style.overflowY = "auto";
    }

    // Create initial calendar structure
    this.render();

    // Set up event listener for transaction data
    document.addEventListener("transaction-data-updated", (event) => {
      this.updateData(event.detail);
    });

    // Set up event listener for window resize
    window.addEventListener("resize", this.handleResize.bind(this));

    // Initial resize
    this.handleResize();
  }

  handleResize() {
    // Adjust calendar size based on container width
    if (this.container) {
      // If screen is smaller than 768px, use a more compact day cell
      const isMobile = window.innerWidth < 768;

      const calendar = this.container.querySelector(".calendar");
      if (calendar) {
        if (isMobile || window.innerWidth < 1200) {
          calendar.classList.add("compact");
        } else {
          calendar.classList.remove("compact");
        }
      }
    }
  }

  updateData(data) {
    if (!data || !data.stats || !data.stats.daily_expenses) {
      return;
    }

    // Format the daily expenses data for the calendar
    this.data = {};

    Object.entries(data.stats.daily_expenses).forEach(([dateStr, amount]) => {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        this.data[dateStr] = Math.abs(amount);
      }
    });

    this.render();
  }

  render() {
    if (!this.container) return;

    // Get month info
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Calculate the maximum expense amount for heat mapping
    const values = Object.values(this.data).filter((v) => v > 0);
    const maxAmount = values.length > 0 ? Math.max(...values) : 0;

    // Determine if we're in compact mode (for mobile or smaller screens)
    const isMobile = window.innerWidth < 768;
    const isSmall = window.innerWidth < 1200;
    const compactClass = isMobile || isSmall ? "compact" : "";

    // Generate HTML
    let html = `
      <div class="calendar ${compactClass}" style="max-width:100%; margin:0; box-sizing:border-box;">
        <div class="calendar-header" style="padding:10px;">
          <button class="prev-month">&#10094;</button>
          <h2 style="font-size:${isMobile ? "1rem" : "1.2rem"}; margin:0;">${
      monthNames[this.currentMonth]
    } ${this.currentYear}</h2>
          <button class="next-month">&#10095;</button>
        </div>
        
        <div class="weekdays" style="font-size:${
          isMobile ? "0.7rem" : "0.8rem"
        };">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div class="days" style="padding:${isMobile ? "5px" : "8px"}; gap:${
      isMobile ? "2px" : "3px"
    };">
    `;

    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      html += `<div class="day empty"></div>`;
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Format the date to YYYY-MM-DD for lookup
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dateStr = date.toISOString().split("T")[0];

      const amount = this.data[dateStr] || 0;

      // Calculate heat level (0-5) based on amount
      let heatLevel = 0;
      if (amount > 0 && maxAmount > 0) {
        // Calculate percentage and map to 1-5 levels
        const percentage = amount / maxAmount;
        heatLevel = Math.ceil(percentage * 5);
      }

      // Today class
      const isToday = this.isToday(day);

      // Formatting for amount display (abbreviated for compact view)
      let amountDisplay = "";
      if (amount > 0) {
        if ((isMobile || isSmall) && amount >= 1000) {
          // For mobile, use abbreviated form (1K, 2.5K) for amounts >= 1000
          amountDisplay = `${(amount / 1000).toFixed(1)}K`;
        } else {
          amountDisplay = amount.toFixed(0);
        }
      }

      html += `
        <div class="day ${
          isToday ? "today" : ""
        } heat-${heatLevel}" data-date="${dateStr}" style="min-height:${
        isMobile ? "40px" : "60px"
      }; padding:${isMobile ? "2px" : "4px"};">
          <div class="day-number" style="font-size:${
            isMobile ? "0.7rem" : "0.8rem"
          };">${day}</div>
          ${
            amount > 0
              ? `<div class="amount" style="margin-top:${
                  isMobile ? "14px" : "20px"
                }; font-size:${
                  isMobile ? "0.8rem" : "0.9rem"
                };">${amountDisplay}</div>`
              : ""
          }
        </div>
      `;
    }

    html += `
        </div>
        
        <div class="legend" style="padding:${
          isMobile ? "5px" : "10px"
        }; font-size:${isMobile ? "0.7rem" : "0.8rem"};">
          <div class="legend-title">Daily Spending</div>
          <div class="legend-scale" style="gap:${isMobile ? "5px" : "10px"};">
            <div class="legend-item">
              <div class="legend-color heat-0"></div>
              <div class="legend-label">None</div>
            </div>
            <div class="legend-item">
              <div class="legend-color heat-1"></div>
              <div class="legend-label">Low</div>
            </div>
            <div class="legend-item">
              <div class="legend-color heat-3"></div>
              <div class="legend-label">Medium</div>
            </div>
            <div class="legend-item">
              <div class="legend-color heat-5"></div>
              <div class="legend-label">High</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Add event listeners for navigation
    const prevBtn = this.container.querySelector(".prev-month");
    const nextBtn = this.container.querySelector(".next-month");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.render();
      });
    }

    // Add event listeners for day click
    const days = this.container.querySelectorAll(".day:not(.empty)");
    days.forEach((day) => {
      day.addEventListener("click", () => {
        const dateStr = day.getAttribute("data-date");
        const amount = this.data[dateStr] || 0;

        if (amount > 0) {
          this.showDayDetail(dateStr, amount);
        }
      });
    });
  }

  isToday(day) {
    const today = new Date();
    return (
      day === today.getDate() &&
      this.currentMonth === today.getMonth() &&
      this.currentYear === today.getFullYear()
    );
  }

  showDayDetail(dateStr, amount) {
    // Create a modal or popup with detailed info
    const modal = document.createElement("div");
    modal.className = "calendar-modal";

    const formatted = new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    modal.innerHTML = `
      <div class="calendar-modal-content">
        <span class="close-modal">&times;</span>
        <h3>${formatted}</h3>
        <p>Total spending: NOK ${amount.toFixed(2)}</p>
        <p>Click the close button or outside the modal to close</p>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button event
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Click outside to close
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  cleanup() {
    // Clean up event listeners
    window.removeEventListener("resize", this.handleResize.bind(this));
    document.removeEventListener("transaction-data-updated", this.updateData);
  }
}

export default CalendarView;

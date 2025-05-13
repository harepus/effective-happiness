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
    // Create initial calendar structure
    this.render();

    // Set up event listener for transaction data
    document.addEventListener("transaction-data-updated", (event) => {
      this.updateData(event.detail);
    });
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

    // Generate HTML
    let html = `
      <div class="calendar">
        <div class="calendar-header">
          <button class="prev-month">&#10094;</button>
          <h2>${monthNames[this.currentMonth]} ${this.currentYear}</h2>
          <button class="next-month">&#10095;</button>
        </div>
        
        <div class="weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div class="days">
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

      html += `
        <div class="day ${
          isToday ? "today" : ""
        } heat-${heatLevel}" data-date="${dateStr}">
          <div class="day-number">${day}</div>
          ${amount > 0 ? `<div class="amount">${amount.toFixed(0)}</div>` : ""}
        </div>
      `;
    }

    html += `
        </div>
        
        <div class="legend">
          <div class="legend-title">Daily Spending</div>
          <div class="legend-scale">
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
}

export default CalendarView;

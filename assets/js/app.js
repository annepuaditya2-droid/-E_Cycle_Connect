    (function () {
      "use strict";

      var STORAGE_KEY = "ecycle-connect-bookings-v1";
      var POINTS_KEY = "ecycle-connect-points-v1";
      var SESSION_KEY = "ecycle-connect-demo-session-v1";
      var steps = ["Requested", "Collected", "Inspected", "Next step", "Completed"];
      var demoAccounts = {
        customer: { email: "customer@ecycleconnect.demo", password: "customer123", name: "Demo Customer" },
        admin: { email: "admin@ecycleconnect.demo", password: "admin123", name: "Demo Admin" }
      };
      var statusOptions = [
        { value: "requested", stage: 0, label: "Requested", outcome: "Request confirmed. Awaiting collection." },
        { value: "collected", stage: 1, label: "Collected", outcome: "Item collected and on its way to inspection." },
        { value: "inspected", stage: 2, label: "Inspected — assessing result", outcome: "Inspection complete. We’re confirming the best next step for this item." },
        { value: "reuse", stage: 3, label: "Working — reuse", outcome: "Inspection complete: item is working and headed for reuse or resale." },
        { value: "repair", stage: 3, label: "Repairable — repair", outcome: "Inspection complete: item is repairable and headed for repair." },
        { value: "components", stage: 3, label: "Reusable components", outcome: "Inspection complete: useful components are being recovered and tested." },
        { value: "recycling", stage: 3, label: "Unusable — recycling", outcome: "Inspection complete: item is headed to an authorized recycling partner." },
        { value: "completed", stage: 4, label: "Completed", outcome: "Journey completed. Thank you for making a more sustainable choice." }
      ];
      var categoryPoints = {
        "Mobile phone": 100,
        "Laptop or computer": 200,
        "Charger or cables": 50,
        "Battery": 50,
        "Keyboard or accessories": 50,
        "Other electronics": 100
      };
      var toastTimer;

      function readBookings() {
        try {
          var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          return Array.isArray(saved) ? saved : [];
        } catch (error) {
          return [];
        }
      }

      function saveBookings(bookings) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
          return true;
        } catch (error) {
          showToast("Your browser couldn't save this request. Please check your storage settings and try again.");
          return false;
        }
      }

      function showToast(message) {
        var toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () { toast.classList.remove("visible"); }, 3800);
      }

      function currentSession() {
        try {
          var session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
          return session && (session.role === "customer" || session.role === "admin") ? session : null;
        } catch (error) {
          return null;
        }
      }

      function renderAccount() {
        var session = currentSession();
        var account = document.getElementById("navAccount");
        account.classList.add("visible");
        document.getElementById("accountLabel").textContent = session ? session.name + " · " + session.role : "";
        document.getElementById("authButton").textContent = session ? "Sign out" : "Sign in";
        document.getElementById("adminOperations").classList.toggle("role-admin", !!session && session.role === "admin");
        document.getElementById("adminNav").classList.toggle("visible", !!session && session.role === "admin");
        document.getElementById("bookingAuthPrompt").classList.toggle("visible", !session || session.role !== "customer");
        var bookingName = document.getElementById("customerName");
        var bookingEmail = document.getElementById("customerEmail");
        if (session && session.role === "customer") {
          if (!bookingName.value) bookingName.value = session.name;
          if (!bookingEmail.value) bookingEmail.value = session.email;
        } else {
          bookingName.value = "";
          bookingEmail.value = "";
        }
      }

      function openAuth(role) {
        var modal = document.getElementById("authBackdrop");
        modal.classList.add("open");
        setAuthRole(role || "customer");
        document.getElementById("authEmail").focus();
      }

      function setAuthRole(role) {
        var isAdmin = role === "admin";
        document.querySelectorAll(".auth-tab").forEach(function (tab) {
          var active = tab.dataset.role === role;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-selected", String(active));
        });
        document.getElementById("authNameField").hidden = isAdmin;
        document.getElementById("authTitle").textContent = isAdmin ? "Admin sign in." : "Welcome back.";
        document.getElementById("authSubmit").innerHTML = (isAdmin ? "Sign in as admin" : "Sign in as customer") + ' <span class="arrow">→</span>';
        document.getElementById("authDemo").innerHTML = isAdmin
          ? "<strong>Admin demo:</strong> " + demoAccounts.admin.email + " · " + demoAccounts.admin.password
          : "<strong>Customer demo:</strong> " + demoAccounts.customer.email + " · " + demoAccounts.customer.password;
        document.getElementById("authError").textContent = "";
        document.getElementById("authForm").dataset.role = role;
        document.getElementById("authEmail").value = "";
        document.getElementById("authPassword").value = "";
      }

      document.getElementById("navAccount").classList.add("visible");
      document.getElementById("authButton").addEventListener("click", function () {
        if (currentSession()) {
          localStorage.removeItem(SESSION_KEY);
          renderAccount();
          showToast("You've signed out.");
        } else {
          openAuth("customer");
        }
      });
      document.getElementById("authClose").addEventListener("click", function () {
        document.getElementById("authBackdrop").classList.remove("open");
      });
      document.getElementById("authBackdrop").addEventListener("click", function (event) {
        if (event.target === event.currentTarget) event.currentTarget.classList.remove("open");
      });
      document.querySelectorAll(".auth-tab").forEach(function (tab) {
        tab.addEventListener("click", function () { setAuthRole(tab.dataset.role); });
      });
      document.querySelectorAll(".open-auth").forEach(function (button) {
        button.addEventListener("click", function () { openAuth("customer"); });
      });
      document.getElementById("authForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var role = event.currentTarget.dataset.role;
        var account = demoAccounts[role];
        var email = document.getElementById("authEmail").value.trim().toLowerCase();
        var password = document.getElementById("authPassword").value;
        var error = document.getElementById("authError");
        if (email !== account.email || password !== account.password) {
          error.textContent = "Those demo credentials don't match. Use the account shown below.";
          return;
        }
        var session = { role: role, email: account.email, name: role === "customer" ? (document.getElementById("authName").value.trim() || account.name) : account.name };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (storageError) {
          error.textContent = "This browser couldn't save your demo sign-in. Check your storage settings and try again.";
          return;
        }
        document.getElementById("authBackdrop").classList.remove("open");
        renderAccount();
        showToast("Signed in as " + role + ".");
        if (role === "admin") document.getElementById("operations").scrollIntoView({ behavior: "smooth" });
      });

      function updatePoints() {
        var points = Number(localStorage.getItem(POINTS_KEY) || 0);
        document.getElementById("rewardPoints").textContent = Number.isFinite(points) ? points.toLocaleString("en-IN") : "0";
      }

      function renderJourney(booking) {
        document.getElementById("journeyPlaceholder").style.display = "none";
        var result = document.getElementById("journeyResult");
        result.classList.add("visible");
        document.getElementById("journeyItem").textContent = booking.category;
        document.getElementById("journeyMeta").textContent = booking.name + " · " + booking.pickupType + " · " + booking.date;
        document.getElementById("journeyCode").textContent = booking.id;

        var timeline = document.getElementById("timeline");
        timeline.textContent = "";
        var current = Number(booking.stage || 0);
        steps.forEach(function (step, index) {
          var item = document.createElement("div");
          item.className = "timeline-step" + (index <= current ? " done" : "") + (index === current ? " active" : "");
          var dot = document.createElement("div");
          dot.className = "timeline-dot";
          dot.textContent = index <= current ? "✓" : "";
          var label = document.createElement("span");
          label.textContent = step;
          item.appendChild(dot);
          item.appendChild(label);
          timeline.appendChild(item);
        });

        var outcome = booking.outcome || "Your request is confirmed. We'll update this journey as your item moves through collection, inspection, and its next destination.";
        document.getElementById("journeyOutcome").textContent = outcome;
      }

      function renderRequests() {
        var list = document.getElementById("requestList");
        var bookings = readBookings();
        list.textContent = "";
        if (!bookings.length) {
          var empty = document.createElement("div");
          empty.className = "empty-ops";
          empty.textContent = "New pickup requests will appear here after you book a collection.";
          list.appendChild(empty);
          return;
        }

        bookings.slice().reverse().forEach(function (booking) {
          var row = document.createElement("div");
          row.className = "request-row";
          var info = document.createElement("div");
          var name = document.createElement("strong");
          name.textContent = booking.category + " · " + booking.name;
          var meta = document.createElement("small");
          meta.textContent = booking.id + " · " + booking.condition;
          info.appendChild(name);
          info.appendChild(meta);

          var select = document.createElement("select");
          select.setAttribute("aria-label", "Update status for " + booking.id);
          statusOptions.forEach(function (status) {
            var option = document.createElement("option");
            option.value = status.value;
            option.textContent = status.label;
            if ((booking.status || "requested") === status.value) option.selected = true;
            select.appendChild(option);
          });
          select.addEventListener("change", function () {
            var updated = readBookings();
            var target = updated.find(function (item) { return item.id === booking.id; });
            if (!target) {
              showToast("This booking could not be found. Please refresh the page.");
              renderRequests();
              return;
            }
            var selectedStatus = statusOptions.find(function (status) { return status.value === select.value; });
            target.status = selectedStatus.value;
            target.stage = selectedStatus.stage;
            target.outcome = selectedStatus.outcome;
            if (target.status === "completed" && !target.pointsAwarded) {
              target.pointsAwarded = true;
              var points = Number(localStorage.getItem(POINTS_KEY) || 0) + (categoryPoints[target.category] || 50);
              try { localStorage.setItem(POINTS_KEY, String(points)); } catch (error) { showToast("The booking was updated, but your rewards couldn't be saved in this browser."); }
              updatePoints();
            }
            if (!saveBookings(updated)) return;
            renderRequests();
            if (document.getElementById("journeyCode").textContent === target.id) renderJourney(target);
            showToast("Journey updated for " + target.id + ".");
          });
          row.appendChild(info);
          row.appendChild(select);
          list.appendChild(row);
        });
      }

      document.getElementById("currentYear").textContent = String(new Date().getFullYear());
      updatePoints();
      renderRequests();
      renderAccount();

      var pickupDate = document.getElementById("pickupDate");
      var today = new Date();
      pickupDate.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

      document.getElementById("categoryGrid").addEventListener("click", function (event) {
        var button = event.target.closest("[data-category]");
        if (!button) return;
        document.querySelectorAll(".category-option").forEach(function (option) { option.classList.remove("selected"); });
        button.classList.add("selected");
        document.getElementById("selectedCategory").value = button.dataset.category;
      });

      document.getElementById("bookingForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var form = event.currentTarget;
        var session = currentSession();
        if (!session || session.role !== "customer") {
          showToast("Please sign in with a customer account before booking a pickup.");
          openAuth("customer");
          return;
        }
        var category = document.getElementById("selectedCategory").value;
        if (!category) {
          showToast("Please select the type of e-waste you'd like us to collect.");
          return;
        }
        if (!form.reportValidity()) return;
        var id = "EC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        var booking = {
          id: id,
          name: document.getElementById("customerName").value.trim(),
          phone: document.getElementById("customerPhone").value.trim(),
          email: document.getElementById("customerEmail").value.trim(),
          address: document.getElementById("customerAddress").value.trim(),
          date: document.getElementById("pickupDate").value,
          category: category,
          condition: document.getElementById("itemCondition").value,
          pickupType: document.getElementById("pickupType").value,
          details: document.getElementById("itemDetails").value.trim(),
          ownerEmail: session.email,
          status: "requested",
          stage: 0,
          outcome: "Your request is confirmed. We'll update this journey as your item moves through collection, inspection, and its next destination.",
          pointsAwarded: false,
          createdAt: new Date().toISOString()
        };
        var bookings = readBookings();
        bookings.push(booking);
        if (!saveBookings(bookings)) return;

        var message = document.getElementById("bookingMessage");
        message.innerHTML = "Your pickup request is confirmed! Your tracking ID is <strong>" + id + "</strong>. Save this ID to follow your item's journey.";
        message.classList.add("visible");
        document.getElementById("trackingInput").value = id;
        document.getElementById("trackingError").textContent = "";
        renderJourney(booking);
        renderRequests();
        form.reset();
        document.querySelectorAll(".category-option").forEach(function (option) { option.classList.remove("selected"); });
        document.getElementById("selectedCategory").value = "";
        showToast("Pickup booked. Your tracking ID is " + id + ".");
      });

      document.getElementById("trackingForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var id = document.getElementById("trackingInput").value.trim().toUpperCase();
        var booking = readBookings().find(function (item) { return item.id.toUpperCase() === id; });
        var error = document.getElementById("trackingError");
        if (!id) {
          error.textContent = "Enter your tracking ID to continue.";
          return;
        }
        if (!booking) {
          error.textContent = "We couldn't find that ID in this browser. Check the code or book a pickup here.";
          return;
        }
        error.textContent = "";
        renderJourney(booking);
      });

      document.querySelectorAll(".filter-btn").forEach(function (button) {
        button.addEventListener("click", function () {
          document.querySelectorAll(".filter-btn").forEach(function (item) { item.classList.remove("active"); });
          button.classList.add("active");
          var filter = button.dataset.filter;
          document.querySelectorAll(".product-card").forEach(function (card) {
            card.classList.toggle("hidden", filter !== "all" && card.dataset.type !== filter);
          });
        });
      });

      document.querySelectorAll(".product-buy").forEach(function (button) {
        button.addEventListener("click", function () {
          showToast("Thanks for your interest in " + button.dataset.product + "! Please contact hello@ecycleconnect.demo to enquire.");
        });
      });

      document.getElementById("feedbackForm").addEventListener("submit", function (event) {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        event.currentTarget.reset();
        showToast("Thanks for your feedback! This demo form doesn't send data to a server.");
      });

      var menuToggle = document.getElementById("menuToggle");
      var navLinks = document.getElementById("navLinks");
      menuToggle.addEventListener("click", function () {
        var isOpen = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
        menuToggle.textContent = isOpen ? "×" : "☰";
      });
      navLinks.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          navLinks.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Open navigation menu");
          menuToggle.textContent = "☰";
        }
      });
    }());

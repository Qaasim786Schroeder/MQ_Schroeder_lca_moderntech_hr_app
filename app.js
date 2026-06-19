const { createApp } = Vue;

createApp({
  data() {
    return {
      // Mock Authentication States
      isLoggedIn: false,
      username: "",
      password: "",
      loginError: false,
      mockCredentials: {
        username: "admin@moderntech.co.za",
        password: "Password123!",
      },

      // Existing Application States
      employees: [],
      searchQuery: "",
      filterDepartment: "",
      isEditMode: false,
      activePayslip: null,
      selectedLeaveEmployee: null,
      formEmployee: {
        id: null,
        firstName: "",
        lastName: "",
        email: "",
        department: "Software Development",
        position: "",
        status: "Active",
        salary: { base: 0, hoursWorked: 160, allowance: 0 },
        attendance: { present: 20, leaveBalance: 15 },
        timeOffRequests: [],
      },
      leaveFormModel: {
        type: "Annual",
        startDate: "",
        endDate: "",
        days: 0,
      },
    };
  },
  computed: {
    filteredEmployees() {
      return this.employees.filter((emp) => {
        const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.email}`
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        const matchesDept =
          this.filterDepartment === "" ||
          emp.department === this.filterDepartment;
        return matchesSearch && matchesDept;
      });
    },
    totalPendingRequests() {
      let count = 0;
      this.employees.forEach((emp) => {
        if (emp.timeOffRequests) {
          emp.timeOffRequests.forEach((req) => {
            if (req.status === "Pending") count++;
          });
        }
      });
      return count;
    },
    // Dynamic Attendance Rate Calculator for Charts
    attendanceRate() {
      if (this.employees.length === 0) return 0;
      const totalActive = this.employees.filter(
        (e) => e.status === "Active",
      ).length;
      const totalOnLeave = this.employees.filter(
        (e) => e.status === "On Active Leave",
      ).length;
      return ((totalActive / (totalActive + totalOnLeave || 1)) * 100).toFixed(
        1,
      );
    },
    // Dynamic Department Distribution Calculator for Data Visualisation
    departmentDistribution() {
      const counts = { dev: 0, qa: 0, hr: 0, other: 0 };
      this.employees.forEach((emp) => {
        if (emp.department === "Software Development") counts.dev++;
        else if (emp.department === "Quality Assurance") counts.qa++;
        else if (emp.department === "Human Resources") counts.hr++;
        else counts.other++;
      });

      const total = this.employees.length || 1;
      return {
        devPct: ((counts.dev / total) * 100).toFixed(0),
        qaPct: ((counts.qa / total) * 100).toFixed(0),
        hrPct: ((counts.hr / total) * 100).toFixed(0),
        otherPct: ((counts.other / total) * 100).toFixed(0),
      };
    },
  },
  methods: {
    // Authentication Logic
    handleLogin() {
      if (
        this.username === this.mockCredentials.username &&
        this.password === this.mockCredentials.password
      ) {
        this.isLoggedIn = true;
        this.loginError = false;
        localStorage.setItem("moderntech_hr_logged_in", "true");
      } else {
        this.loginError = true;
      }
    },
    handleLogout() {
      this.isLoggedIn = false;
      this.username = "";
      this.password = "";
      localStorage.removeItem("moderntech_hr_logged_in");
    },

    // Core Data Access Layer
    loadData() {
      const cached = localStorage.getItem("moderntech_hr_db");
      if (cached) {
        this.employees = JSON.parse(cached);
      } else if (typeof initialEmployees !== "undefined") {
        this.employees = JSON.parse(JSON.stringify(initialEmployees));
        this.saveToStorage();
      } else {
        this.employees = [];
      }

      // Check persistent session authentication state
      if (localStorage.getItem("moderntech_hr_logged_in") === "true") {
        this.isLoggedIn = true;
      }
    },
    saveToStorage() {
      localStorage.setItem("moderntech_hr_db", JSON.stringify(this.employees));
    },
    resetToDefaultData() {
      localStorage.removeItem("moderntech_hr_db");
      if (typeof initialEmployees !== "undefined") {
        this.employees = JSON.parse(JSON.stringify(initialEmployees));
      } else {
        this.employees = [];
      }
      this.saveToStorage();
    },
    countStatus(statusValue) {
      return this.employees.filter((e) => e.status === statusValue).length;
    },

    // Automated Financial Accounting Logic
    calculateGross(emp) {
      if (!emp || !emp.salary) return 0;
      return (
        (Number(emp.salary.base) || 0) + (Number(emp.salary.allowance) || 0)
      );
    },
    calculateTax(emp) {
      return this.calculateGross(emp) * 0.2;
    },
    calculateNet(emp) {
      return this.calculateGross(emp) - this.calculateTax(emp);
    },

    // Employee Profiles Operations
    triggerAddMode() {
      this.isEditMode = false;
      this.formEmployee = {
        id: Date.now(),
        firstName: "",
        lastName: "",
        email: "",
        department: "Software Development",
        position: "",
        status: "Active",
        salary: { base: 30000, hoursWorked: 160, allowance: 2000 },
        attendance: { present: 20, leaveBalance: 15 },
        timeOffRequests: [],
      };
    },
    triggerEditMode(emp) {
      this.isEditMode = true;
      this.formEmployee = JSON.parse(JSON.stringify(emp));
    },
    saveEmployeeRecord() {
      if (this.isEditMode) {
        const idx = this.employees.findIndex(
          (e) => e.id === this.formEmployee.id,
        );
        if (idx !== -1) {
          this.employees[idx] = JSON.parse(JSON.stringify(this.formEmployee));
        }
      } else {
        this.employees.push(JSON.parse(JSON.stringify(this.formEmployee)));
      }
      this.saveToStorage();

      const closeBtn = document.getElementById("closeEmployeeModalBtn");
      if (closeBtn) closeBtn.click();
    },
    deleteEmployeeRecord(id) {
      if (
        confirm(
          "Are you sure you want to terminate this operational profile asset record?",
        )
      ) {
        this.employees = this.employees.filter((e) => e.id !== id);
        this.saveToStorage();
      }
    },
    viewPayslip(emp) {
      this.activePayslip = emp;
    },

    // Attendance Administration Logic
    prepLeaveForm(emp) {
      this.selectedLeaveEmployee = emp;
      this.leaveFormModel = {
        type: "Annual",
        startDate: "",
        endDate: "",
        days: 0,
      };
    },
    calculateLeaveDays() {
      if (this.leaveFormModel.startDate && this.leaveFormModel.endDate) {
        const start = new Date(this.leaveFormModel.startDate);
        const end = new Date(this.leaveFormModel.endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        this.leaveFormModel.days = diffDays > 0 ? diffDays : 0;
      }
    },
    submitLeaveForm() {
      const idx = this.employees.findIndex(
        (e) => e.id === this.selectedLeaveEmployee.id,
      );
      if (idx !== -1) {
        if (!this.employees[idx].timeOffRequests) {
          this.employees[idx].timeOffRequests = [];
        }
        this.employees[idx].timeOffRequests.push({
          id: Date.now(),
          type: this.leaveFormModel.type,
          days: this.leaveFormModel.days,
          status: "Pending",
        });
        this.saveToStorage();
      }
      const closeBtn = document.getElementById("closeLeaveModalBtn");
      if (closeBtn) closeBtn.click();
    },
    evaluateLeave(empId, reqId, nextStatus) {
      const empIdx = this.employees.findIndex((e) => e.id === empId);
      if (empIdx !== -1) {
        const reqIdx = this.employees[empIdx].timeOffRequests.findIndex(
          (r) => r.id === reqId,
        );
        if (reqIdx !== -1) {
          this.employees[empIdx].timeOffRequests[reqIdx].status = nextStatus;
          if (nextStatus === "Approved") {
            this.employees[empIdx].attendance.leaveBalance -=
              this.employees[empIdx].timeOffRequests[reqIdx].days;
            this.employees[empIdx].status = "On Active Leave";
          } else if (nextStatus === "Denied") {
            this.employees[empIdx].status = "Active";
          }
          this.saveToStorage();
        }
      }
    },
  },
  mounted() {
    this.loadData();
  },
}).mount("#app");

// app.js
const { createApp } = Vue;

createApp({
  data() {
    return {
      // Safely grab data from window variable or localStorage fallback
      employees:
        JSON.parse(localStorage.getItem("moderntech_hr_employees")) ||
        window.initialEmployees,
      searchQuery: "",
      filterDepartment: "",

      isEditMode: false,
      editEmployeeId: null,
      formEmployee: this.getEmptyEmployeeTemplate(),

      activePayslip: null,
      selectedLeaveEmployee: null,
      leaveFormModel: { type: "Annual", startDate: "", endDate: "", days: 0 },
    };
  },
  watch: {
    employees: {
      handler(newVal) {
        localStorage.setItem("moderntech_hr_employees", JSON.stringify(newVal));
      },
      deep: true,
    },
  },
  computed: {
    filteredEmployees() {
      return this.employees.filter((emp) => {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const matchesSearch =
          fullName.includes(this.searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesDept =
          this.filterDepartment === "" ||
          emp.department === this.filterDepartment;
        return matchesSearch && matchesDept;
      });
    },
    totalPendingRequests() {
      return this.employees.reduce((acc, emp) => {
        return (
          acc + emp.timeOffRequests.filter((r) => r.status === "Pending").length
        );
      }, 0);
    },
    totalRequestsCount() {
      return this.employees.reduce(
        (acc, emp) => acc + emp.timeOffRequests.length,
        0,
      );
    },
  },
  methods: {
    countStatus(statusString) {
      return this.employees.filter((e) => e.status === statusString).length;
    },
    getEmptyEmployeeTemplate() {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "Software Development",
        position: "",
        joinDate: "2026-06-18",
        status: "Active",
        salary: {
          base: 25000,
          hourlyRate: 144,
          hoursWorked: 160,
          allowance: 0,
        },
        attendance: { present: 20, absent: 0, leaveBalance: 15 },
        timeOffRequests: [],
      };
    },
    triggerAddMode() {
      this.isEditMode = false;
      this.formEmployee = this.getEmptyEmployeeTemplate();
    },
    triggerEditMode(employee) {
      this.isEditMode = true;
      this.editEmployeeId = employee.id;
      this.formEmployee = JSON.parse(JSON.stringify(employee));
    },
    saveEmployee() {
      const formElement = document.getElementById("employeeForm");
      if (!formElement.checkValidity()) {
        formElement.classList.add("was-validated");
        return;
      }

      this.formEmployee.salary.hourlyRate = Math.round(
        this.formEmployee.salary.base / 160,
      );

      if (this.isEditMode) {
        const targetIndex = this.employees.findIndex(
          (e) => e.id === this.editEmployeeId,
        );
        if (targetIndex !== -1) {
          this.employees[targetIndex] = { ...this.formEmployee };
        }
      } else {
        this.formEmployee.id = Date.now();
        this.employees.push({ ...this.formEmployee });
      }

      document.getElementById("closeEmpModal").click();
      formElement.classList.remove("was-validated");
    },
    deleteEmployee(id) {
      if (
        confirm(
          "Are you completely certain you want to remove this employee profile entry file?",
        )
      ) {
        this.employees = this.employees.filter((e) => e.id !== id);
      }
    },
    calculateGross(emp) {
      return emp.salary.base + emp.salary.allowance;
    },
    calculateTax(emp) {
      return Math.round(this.calculateGross(emp) * 0.2);
    },
    calculateNet(emp) {
      return this.calculateGross(emp) - this.calculateTax(emp);
    },
    viewPayslip(employee) {
      this.activePayslip = employee;
    },
    prepLeaveForm(employee) {
      this.selectedLeaveEmployee = employee;
      this.leaveFormModel = {
        type: "Annual",
        startDate: "",
        endDate: "",
        days: 0,
      };
    },
    calculateLeaveDays() {
      const start = new Date(this.leaveFormModel.startDate);
      const end = new Date(this.leaveFormModel.endDate);
      if (start && end && end >= start) {
        const difference = Math.abs(end - start);
        this.leaveFormModel.days =
          Math.ceil(difference / (1000 * 60 * 60 * 24)) + 1;
      } else {
        this.leaveFormModel.days = 0;
      }
    },
    submitLeaveForm() {
      if (this.leaveFormModel.days <= 0) return;

      const newRequest = {
        id: Date.now(),
        type: this.leaveFormModel.type,
        startDate: this.leaveFormModel.startDate,
        endDate: this.leaveFormModel.endDate,
        days: this.leaveFormModel.days,
        status: "Pending",
      };

      const matchingIndex = this.employees.findIndex(
        (e) => e.id === this.selectedLeaveEmployee.id,
      );
      if (matchingIndex !== -1) {
        this.employees[matchingIndex].timeOffRequests.push(newRequest);
      }

      document.getElementById("closeLeaveModal").click();
    },
    evaluateLeave(employeeId, requestId, outcome) {
      const empIndex = this.employees.findIndex((e) => e.id === employeeId);
      if (empIndex === -1) return;

      const reqIndex = this.employees[empIndex].timeOffRequests.findIndex(
        (r) => r.id === requestId,
      );
      if (reqIndex === -1) return;

      const currentRequest = this.employees[empIndex].timeOffRequests[reqIndex];
      currentRequest.status = outcome;

      if (outcome === "Approved") {
        this.employees[empIndex].attendance.leaveBalance -= currentRequest.days;
        this.employees[empIndex].status = "On Leave";
      }
    },
    resetToDefaultData() {
      if (
        confirm(
          "Reset current instance state data arrays back to default factory mock values?",
        )
      ) {
        localStorage.removeItem("moderntech_hr_employees");
        this.employees = JSON.parse(JSON.stringify(window.initialEmployees));
      }
    },
  },
}).mount("#app");

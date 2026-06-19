const { createApp } = Vue;

createApp({
  data() {
    return {
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
        emp.timeOffRequests.forEach((req) => {
          if (req.status === "Pending") count++;
        });
      });
      return count;
    },
  },
  methods: {
    loadData() {
      const cached = localStorage.getItem("moderntech_hr_db");
      if (cached) {
        this.employees = JSON.parse(cached);
      } else {
        this.employees = JSON.parse(JSON.stringify(initialEmployees));
        this.saveToStorage();
      }
    },
    saveToStorage() {
      localStorage.setItem("moderntech_hr_db", JSON.stringify(this.employees));
    },
    resetToDefaultData() {
      localStorage.removeItem("moderntech_hr_db");
      this.employees = JSON.parse(JSON.stringify(initialEmployees));
      this.saveToStorage();
    },
    countStatus(statusValue) {
      return this.employees.filter((e) => e.status === statusValue).length;
    },
    calculateGross(emp) {
      return (emp.salary.base || 0) + (emp.salary.allowance || 0);
    },
    calculateTax(emp) {
      return this.calculateGross(emp) * 0.2;
    },
    calculateNet(emp) {
      return this.calculateGross(emp) - this.calculateTax(emp);
    },
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
        if (idx !== -1)
          this.employees[idx] = JSON.parse(JSON.stringify(this.formEmployee));
      } else {
        this.employees.push(JSON.parse(JSON.stringify(this.formEmployee)));
      }
      this.saveToStorage();
      document.getElementById("closeEmployeeModalBtn").click();
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
        this.employees[idx].timeOffRequests.push({
          id: Date.now(),
          type: this.leaveFormModel.type,
          days: this.leaveFormModel.days,
          status: "Pending",
        });
        this.saveToStorage();
      }
      document.getElementById("closeLeaveModalBtn").click();
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

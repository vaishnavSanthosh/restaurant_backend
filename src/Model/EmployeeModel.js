//#region header
const db = require("mongoose");
//#endregion

//#region schema
//edited on 11-03-22 ceratin fields added ,renamed and removed from this model
//edited on 15-03-22 edited type of gender
const employeeSchema = new db.Schema({
  emp_id: {
    type: Number,
    unique: true,
  },
  staff_name: String, //renamed on 11-03-22 emp_name to staff_name
  gender: String, //edited on 15-03-22
  fathersName: String, //added on 11-03-22
  maritialStatus: Boolean, //added on 11-03-22
  contactnumber: String, //renamed on 11-03-22 phonenumber to contactNumber
  bloodGroup: String, //added on 11-03-22
  emergencyContactNumber: String, //added on 11-03-22
  address: String,
  email: String,
  dob: Number,
  country: String, //added on 11-03-22
  state: String, //added on 11-03-22
  imageUrl: String,
  username: String, //added on 11-03-22
  password: String, //added on 11-03-22
  hash: String, //added on 11-03-22
  salt: String, //added on 11-03-22
  department: String,
  designation: String,
  date_of_join: Number,
  workHour: Number,
  branchId: String, //renamed on 19-04-22-> from  outletLocation to branchId, changed to required on 15/06/23
  salaryType: String, //renamed on 11-03-22 from salary to salaryType ,type changed to string from number
  monthlySalary: Number, //added on 11-03-22
  contractPeriodFrm: Number, //added on 11-03-22
  contractPeriodTo: Number, //added on 11-03-22
  contractPeriodFrm: Number, //added on 11-03-22
  status: Boolean, //added on 11-03-22
  ac_holder: String, //added on 11-03-22
  ac_no: Number,
  bank: String,
  bank_code: String,
  bankLocation: String, //added on 11-03-22
  pan: String, //added on 11-03-22
  documents: [{}],
  date_of_leaving: Number,
  qrcode: String, //added on 07-03-22
  admin_id: String, //added on 19-04-22
  outletLocation: String, // added on 15/06/23
});
// added on  20-06-23
const documentTypeSchema = new db.Schema({
  documentTypeName: String,
  status: Boolean,
});
//added on 24-02-22
//edited on 20/06/23
const payrollSchema = new db.Schema({
  emp_id: String,
  earnings: {
    basic_salary: { type: Number, required: true },
    hra_allowance: { type: Number, required: true },
    bonus: { type: Number, required: true },
    da_allowance: { type: Number, required: true },
    travel_allowance: { type: Number, required: true },
    over_time: { type: Number, required: true },
    other_allowance: { type: Number, required: true },
    education_allowance: { type: Number, required: true },
    total_earnings: { type: Number, required: true },
  },
  deductions: {
    emi: { type: Number, required: true },
    epf: { type: Number, required: true },
    esi: { type: Number, required: true },
    other_deduction: { type: Number, required: true },
    medical_claim: { type: Number, required: true },
    total_deduction: { type: Number, required: true },
    TDS: { type: Number, required: true },
    loan: { type: Number, required: true },
  },
  payableAmount:{ type: Number, required: true },
  totalPaid:{ type: Number, required: true },
  balancePayment:{ type: Number, required: true },
  date:{ type: Number, required: true },
  branchId: String,
  payment: {},
  transNo: { type: Number, required: true },
});

//added on 24-02-22
//edited on 25-02-22
const payrollItemSchema = new db.Schema({
  earnings: {
    normal_ot: Number,
    publicHoliday_ot: Number,
    restDay_ot: Number,
  },
  /*added deduction field on 25-02-22 */
  deductions: {
    absentAmount: Number,
    advance: Number,
    unpaidLeave: Number,
  },
  branchId: String, //edited  on 07-04-22
});

//added on 14-03-22
//edited 16-06-23
const loanSchema = new db.Schema({
  transNo: Number,
  empId: String, //a/u 
  branchId: String, //a/u
  actualLoanAmount: Number, //a/u 
  tenur: String, //e
  balanceAmount: Number, //a/u 
  paymentMethod: String,//e
  loanType: String,//e
   loanstartDate: Number, //a   /e
  loanRequestedDate: Number, //u
  interestRate: Number,//e
  interestAmount: String,//e
  endDate: Number,//e
  extraInterestAmount: Number,//e
  interestType: String,//e
  imageUrl: [],//e
  loanStatus: String,
  reason: String,
});
loanSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 24-05-22
const attendanceSchema = new db.Schema({
  emp_id: String,
  in: Number,
  out: Number,
  totalWorkHours: Number,
  break: [{}],
  totalBreakHours: Number,
  date: Number,
  branchId: String,
});

//#region exports
module.exports = {
  employeeSchema,
  payrollSchema,
  payrollItemSchema,
  loanSchema,
  attendanceSchema,
  documentTypeSchema,
}; //edited  on 24-05-22
//#endregion
  
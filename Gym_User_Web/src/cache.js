// Basic in-memory cache for data to prevent redundant loading spinners on back navigation
const cache = {
  products: null,
  plans: null,
  facilities: null,
  trainers: null,
  services: null,
  workouts: null,
  diets: null,
  dietTitle: null,
  userInfo: null,
  userPlans: null,
  adminMembers: null,
  adminStaff: null,
  adminEquipment: null,
  adminOrders: null,
  adminProducts: null,
  adminPayments: null,
  adminAssignments: null,
  adminTrainers: null,
  adminFacilities: null,
  adminServices: null,
  dashboardStats: null,
  
  clear() {
    this.products = null;
    this.plans = null;
    this.facilities = null;
    this.trainers = null;
    this.services = null;
    this.workouts = null;
    this.diets = null;
    this.dietTitle = null;
    this.userInfo = null;
    this.userPlans = null;
    this.adminMembers = null;
    this.adminStaff = null;
    this.adminEquipment = null;
    this.adminOrders = null;
    this.adminProducts = null;
    this.adminPayments = null;
    this.adminAssignments = null;
    this.adminTrainers = null;
    this.adminFacilities = null;
    this.adminServices = null;
    this.dashboardStats = null;
  }
};

export default cache;

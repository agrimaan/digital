const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a dashboard name'],
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  layout: {
    type: [
      {
        id: String,
        x: Number,
        y: Number,
        w: Number,
        h: Number,
        minW: Number,
        minH: Number,
        widgetType: {
          type: String,
          enum: [
            'userStats',
            'farmerStats',
            'buyerStats',
            'cropStats',
            'revenueChart',
            'orderStats',
            'weatherWidget',
            'marketPrices',
            'recentTransactions',
            'activeDevices',
            'fieldMap',
            'alertsWidget',
            'taskList',
            'calendar',
            'newsFeed',
            'customMetric',
            'customChart'
          ]
        },
        title: String,
        config: Object
      }
    ],
    default: []
  },
  filters: {
    dateRange: {
      type: String,
      enum: ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom'],
      default: 'last30days'
    },
    customDateStart: {
      type: Date
    },
    customDateEnd: {
      type: Date
    },
    region: {
      type: String
    },
    cropType: {
      type: String
    },
    userSegment: {
      type: String
    },
    otherFilters: {
      type: Object
    }
  },
  refreshInterval: {
    type: Number,
    default: 0 // 0 means no auto-refresh
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
DashboardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
DashboardSchema.index({ adminId: 1 });
DashboardSchema.index({ adminId: 1, isDefault: 1 });

// Static method to get default dashboard for an admin
DashboardSchema.statics.getDefaultDashboard = async function(adminId) {
  let dashboard = await this.findOne({ adminId, isDefault: true });
  
  if (!dashboard) {
    // Create a default dashboard if none exists
    dashboard = await this.create({
      adminId,
      name: 'Default Dashboard',
      isDefault: true,
      layout: [
        {
          id: 'userStats',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          minW: 2,
          minH: 2,
          widgetType: 'userStats',
          title: 'User Statistics'
        },
        {
          id: 'revenueChart',
          x: 4,
          y: 0,
          w: 8,
          h: 4,
          minW: 4,
          minH: 3,
          widgetType: 'revenueChart',
          title: 'Revenue Overview'
        },
        {
          id: 'cropStats',
          x: 0,
          y: 2,
          w: 4,
          h: 2,
          minW: 2,
          minH: 2,
          widgetType: 'cropStats',
          title: 'Crop Statistics'
        },
        {
          id: 'recentTransactions',
          x: 0,
          y: 4,
          w: 12,
          h: 4,
          minW: 6,
          minH: 3,
          widgetType: 'recentTransactions',
          title: 'Recent Transactions'
        }
      ]
    });
  }
  
  return dashboard;
};

// Method to set this dashboard as default
DashboardSchema.methods.setAsDefault = async function() {
  // Unset any existing default dashboards for this admin
  await this.constructor.updateMany(
    { adminId: this.adminId, isDefault: true },
    { isDefault: false }
  );
  
  // Set this one as default
  this.isDefault = true;
  return this.save();
};

module.exports = mongoose.model('Dashboard', DashboardSchema);
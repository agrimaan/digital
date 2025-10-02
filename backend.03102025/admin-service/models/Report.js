const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a report name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'user', 'farmer', 'buyer', 'crop', 'field', 'iot', 'marketplace', 
      'order', 'transaction', 'logistics', 'weather', 'analytics', 
      'financial', 'performance', 'custom'
    ]
  },
  format: {
    type: String,
    enum: ['pdf', 'csv', 'excel', 'json', 'html'],
    default: 'pdf'
  },
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      default: 'monthly'
    },
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, etc.
      min: 0,
      max: 6
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    time: {
      type: String, // HH:MM format
      default: '00:00'
    },
    nextRunDate: {
      type: Date
    }
  },
  filters: {
    dateRange: {
      type: String,
      enum: ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisQuarter', 'lastQuarter', 'thisYear', 'lastYear', 'custom'],
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
  columns: {
    type: [String],
    default: []
  },
  sortBy: {
    field: {
      type: String
    },
    order: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  groupBy: {
    type: String
  },
  chartOptions: {
    chartType: {
      type: String,
      enum: ['bar', 'line', 'pie', 'scatter', 'area', 'radar', 'none'],
      default: 'none'
    },
    xAxis: {
      type: String
    },
    yAxis: {
      type: String
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    colors: {
      type: [String]
    }
  },
  recipients: {
    emails: {
      type: [String],
      default: []
    },
    adminIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Admin',
      default: []
    }
  },
  generatedReports: [
    {
      fileUrl: {
        type: String
      },
      generatedAt: {
        type: Date,
        default: Date.now
      },
      size: {
        type: Number // in bytes
      },
      status: {
        type: String,
        enum: ['success', 'failed', 'processing'],
        default: 'success'
      },
      error: {
        type: String
      }
    }
  ],
  isTemplate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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
ReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate next run date if schedule is enabled
  if (this.schedule.enabled && !this.schedule.nextRunDate) {
    this.calculateNextRunDate();
  }
  
  next();
});

// Method to calculate the next run date based on schedule
ReportSchema.methods.calculateNextRunDate = function() {
  const now = new Date();
  let nextRun = new Date();
  
  // Parse the time
  const [hours, minutes] = this.schedule.time.split(':').map(Number);
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the calculated time is in the past, move to the next occurrence
  if (nextRun < now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  switch (this.schedule.frequency) {
    case 'daily':
      // Already set for next day if needed
      break;
      
    case 'weekly':
      const dayOfWeek = this.schedule.dayOfWeek || 0;
      const currentDay = nextRun.getDay();
      const daysToAdd = (dayOfWeek + 7 - currentDay) % 7;
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;
      
    case 'monthly':
      const dayOfMonth = this.schedule.dayOfMonth || 1;
      nextRun.setDate(1); // Start from the first day of the month
      nextRun.setDate(dayOfMonth);
      
      // If the day is invalid (e.g., February 30), it will roll over to the next month
      // So we need to check and adjust
      if (nextRun < now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setDate(dayOfMonth);
      }
      break;
      
    case 'quarterly':
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);
      const nextQuarterStartMonth = (currentQuarter + 1) * 3;
      
      nextRun.setMonth(nextQuarterStartMonth);
      nextRun.setDate(1);
      break;
      
    case 'yearly':
      const month = this.schedule.month || 0;
      nextRun.setMonth(month);
      nextRun.setDate(this.schedule.dayOfMonth || 1);
      
      if (nextRun < now) {
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      }
      break;
  }
  
  this.schedule.nextRunDate = nextRun;
};

// Method to add a generated report
ReportSchema.methods.addGeneratedReport = function(fileUrl, size, status = 'success', error = null) {
  this.generatedReports.unshift({
    fileUrl,
    generatedAt: new Date(),
    size,
    status,
    error
  });
  
  // Keep only the last 10 reports
  if (this.generatedReports.length > 10) {
    this.generatedReports = this.generatedReports.slice(0, 10);
  }
  
  return this.save();
};

// Static method to get reports due for generation
ReportSchema.statics.getScheduledReportsDue = async function() {
  const now = new Date();
  
  return this.find({
    'schedule.enabled': true,
    'schedule.nextRunDate': { $lte: now }
  });
};

// Index for faster queries
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdBy: 1 });
ReportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRunDate': 1 });
ReportSchema.index({ isTemplate: 1 });

module.exports = mongoose.model('Report', ReportSchema);
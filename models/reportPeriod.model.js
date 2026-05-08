import mongoose from "mongoose";

const reportPeriodSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  semester: { type: String, required: true },
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },  
  toObject: { virtuals: true } 
});

reportPeriodSchema.virtual('isExpired').get(function () {
  return this.dueDate < new Date();
});

const ReportPeriod = mongoose.model('Report-Period', reportPeriodSchema);
export default ReportPeriod;
import mongoose from 'mongoose';

const indicatorDataSchema = new mongoose.Schema({
  definition: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator-Definition', required: true },
  reportPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'Report-Period', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  value: { type: Number, required: true },
  comments: { type: String },
  changesLog: [{
    date: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }]
}, {
  timestamps: true
});

const IndicatorData = mongoose.model('Indicator-Data', indicatorDataSchema);

export default IndicatorData;

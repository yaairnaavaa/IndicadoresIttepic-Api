import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  description: { type: String },
  indicators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Indicator-Definition' }],
}, {
  timestamps: true,
});

const Report = mongoose.model('Report', reportSchema);
export default Report;

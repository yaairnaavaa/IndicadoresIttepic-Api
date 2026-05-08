import mongoose from 'mongoose';

const indicatorDefinitionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  goal: { type: Number, required: true },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true }],
}, {
  timestamps: true,
});

const IndicatorDefinition = mongoose.model('Indicator-Definition', indicatorDefinitionSchema);
export default IndicatorDefinition;

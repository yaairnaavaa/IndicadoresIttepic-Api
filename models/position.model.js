import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
    name: {type: String},
    ascription: {type: mongoose.Schema.Types.ObjectId, ref: 'Department'},
    isUnique: {type: Boolean, default: false},
    gender: {
        male: {type: String, uppercase: true, trim: true},
        female: {type: String, uppercase: true, trim: true}
    },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    isRelevantToIndicators: {type: Boolean, default: false},
});

const positionModel = mongoose.model('Position', positionSchema, 'positions');

export default positionModel;

import mongoose from 'mongoose';

const rolSchema = new mongoose.Schema({
    name: { type: String, unique: true, trim: true, minlength: 4, maxlength: 50 },
    description: { type: String, uppercase: true, trim: true, maxlength: 2500 },
    permissions: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Permission' } ]
});

const roleModel = mongoose.model('Role', rolSchema, 'roles');
export default roleModel;
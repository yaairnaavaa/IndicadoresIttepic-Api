import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    displayName: { type: String, trim: true, required: true },
    iconName: { type: String, trim: true },
    route: { type: String, trim: true },
});

const permissionModel = mongoose.model('Permission', permissionSchema, 'permissions');

export default permissionModel;
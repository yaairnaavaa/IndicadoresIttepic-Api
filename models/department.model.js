import mongoose from "mongoose";

let departmentSchema = new mongoose.Schema({
    name: { type: String },
    shortName: { type: String },
});

const deparmentModel = mongoose.model('Department', departmentSchema, 'departments');

export default deparmentModel;

import mongoose from 'mongoose';

let employeeSchema = new mongoose.Schema({
    rfc: {type: String, unique: true, uppercase: true, trim: true, minlength: 10, maxlength: 13},
    curp: {type: String, unique: true, uppercase: true, trim: true, minlength: 18, maxlength: 18},
    email: {type: String, trim: true},
    name: {
        firstName: {type: String, required: true, uppercase: true, trim: true},
        lastName: {type: String, required: true, uppercase: true, trim: true},
        fullName: {type: String, required: true, uppercase: true, trim: true}
    },
    gender: {type: String, trim: true, enum: ['FEMENINO', 'MASCULINO', 'OTRO']},
    birthDate: {type: Date},
    filename: {type: String},
    grade: [{
        _id: false,
        title: {type: String, uppercase: true, trim: true},
        cedula: {type: String, uppercase: true, trim: true},
        abbreviation: {type: String, uppercase: true, trim: true},
        level: {type: String, enum: ['DOCTORADO', 'MAESTRÍA', 'LICENCIATURA'], uppercase: true, trim: true},
        default: {type: Boolean, default: false}
    }],
    positions: [{
        _id: false,
        position: {type: mongoose.Schema.Types.ObjectId, ref: 'Position'},
        status: {type: String, trim: true, uppercase: true, enum: ['ACTIVE', 'INACTIVE']},
        activateDate: {type: Date},
        deactivateDate: {type: Date},
    }]
});
const employeeModel = mongoose.model('Employee', employeeSchema, 'employees');

export default employeeModel;

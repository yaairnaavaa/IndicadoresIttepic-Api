import mongoose from 'mongoose';
import config from './config.js';
import Department from './models/department.model.js';
import Position from './models/position.model.js';
import Employee from './models/employee.model.js';
import User from './models/user.model.js';
import IndicatorDefinition from './models/indicatorDefinition.model.js';
import Report from './models/report.model.js';
import ReportPeriod from './models/reportPeriod.model.js';

async function seed() {
  try {
    console.log('🔄 Conectando a MongoDB en:', config.dburi);
    await mongoose.connect(config.dburi);
    console.log('✅ Conectado a la base de datos.');

    // Limpiar colecciones anteriores para evitar duplicados
    console.log('🧹 Limpiando colecciones anteriores...');
    await Department.deleteMany({});
    await Position.deleteMany({});
    await Employee.deleteMany({});
    await User.deleteMany({});
    await IndicatorDefinition.deleteMany({});
    await Report.deleteMany({});
    await ReportPeriod.deleteMany({});

    // 1. Departamentos
    console.log('🏢 Creando departamentos...');
    const deptDPPP = await Department.create({
      name: 'DEPARTAMENTO DE PLANEACIÓN, PROGRAMACIÓN Y PRESUPUESTACIÓN',
      shortName: 'DPPP'
    });

    const deptSistemas = await Department.create({
      name: 'DEPARTAMENTO DE SISTEMAS Y COMPUTACIÓN',
      shortName: 'DSC'
    });

    const deptCiencias = await Department.create({
      name: 'DEPARTAMENTO DE CIENCIAS BÁSICAS',
      shortName: 'DCB'
    });

    const deptSubdireccion = await Department.create({
      name: 'SUBDIRECCIÓN DE PLANEACIÓN Y VINCULACIÓN',
      shortName: 'SPV'
    });

    // 2. Puestos / Posiciones
    console.log('💼 Creando puestos...');
    const posJefeDPPP = await Position.create({
      name: 'JEFE DE DEPARTAMENTO',
      ascription: deptDPPP._id,
      isRelevantToIndicators: true,
      gender: {
        male: 'JEFE DE DEPARTAMENTO',
        female: 'JEFA DE DEPARTAMENTO'
      }
    });

    const posSubdirector = await Position.create({
      name: 'SUBDIRECCION DE PLANEACIÓN Y VINCULACIÓN',
      ascription: deptSubdireccion._id,
      isRelevantToIndicators: true,
      gender: {
        male: 'SUBDIRECTOR DE PLANEACIÓN Y VINCULACIÓN',
        female: 'SUBDIRECTORA DE PLANEACIÓN Y VINCULACIÓN'
      }
    });

    const posJefeSistemas = await Position.create({
      name: 'JEFE DE DEPARTAMENTO',
      ascription: deptSistemas._id,
      isRelevantToIndicators: true,
      gender: {
        male: 'JEFE DE DEPARTAMENTO',
        female: 'JEFA DE DEPARTAMENTO'
      }
    });

    // 3. Empleados
    console.log('👤 Creando empleados...');
    const empPlaneacion = await Employee.create({
      rfc: 'RFCPLANEAC01',
      curp: 'CURPPLANEACION0001',
      email: 'planeacion@ittepic.edu.mx',
      name: {
        firstName: 'ADMIN',
        lastName: 'PLANEACIÓN',
        fullName: 'ADMIN PLANEACIÓN'
      },
      gender: 'MASCULINO',
      grade: [{
        title: 'INGENIERO EN SISTEMAS COMPUTACIONALES',
        abbreviation: 'ING.',
        level: 'LICENCIATURA',
        default: true
      }],
      positions: [{
        position: posJefeDPPP._id,
        status: 'ACTIVE',
        activateDate: new Date()
      }]
    });

    const empSistemas = await Employee.create({
      rfc: 'RFCSISTEMA01',
      curp: 'CURPSISTEMAS000001',
      email: 'sistemas@ittepic.edu.mx',
      name: {
        firstName: 'JEFE',
        lastName: 'SISTEMAS',
        fullName: 'JEFE SISTEMAS'
      },
      gender: 'MASCULINO',
      grade: [{
        title: 'MAESTRO EN CIENCIAS',
        abbreviation: 'M.C.',
        level: 'MAESTRÍA',
        default: true
      }],
      positions: [{
        position: posJefeSistemas._id,
        status: 'ACTIVE',
        activateDate: new Date()
      }]
    });

    // 4. Usuarios
    console.log('🔐 Creando usuarios...');
    const userPlaneacion = new User({
      email: 'planeacion@ittepic.edu.mx',
      password: 'password123',
      employeeId: empPlaneacion._id
    });
    await userPlaneacion.save();

    const userSistemas = new User({
      email: 'sistemas@ittepic.edu.mx',
      password: 'password123',
      employeeId: empSistemas._id
    });
    await userSistemas.save();

    // 5. Definiciones de Indicadores
    console.log('📊 Creando indicadores base...');
    const ind1 = await IndicatorDefinition.create({
      key: 'IND-001',
      name: 'Índice de Aprobación Escolar',
      description: 'Porcentaje de asignaturas aprobadas respecto al total cursadas.',
      goal: 85,
      departments: [deptSistemas._id, deptCiencias._id]
    });

    const ind2 = await IndicatorDefinition.create({
      key: 'IND-002',
      name: 'Tasa de Titulación Integral',
      description: 'Porcentaje de alumnos que completaron su proceso de titulación.',
      goal: 75,
      departments: [deptSistemas._id]
    });

    const ind3 = await IndicatorDefinition.create({
      key: 'IND-003',
      name: 'Cumplimiento de Residencia Profesional',
      description: 'Alumnos que concluyeron satisfactoriamente su residencia profesional.',
      goal: 90,
      departments: [deptSistemas._id]
    });

    // 6. Reportes
    console.log('📑 Creando catálogo de reportes...');
    const report1 = await Report.create({
      name: 'Reporte Anual de Indicadores Institucionales 2026',
      description: 'Seguimiento de metas y desempeño institucional Tec Tepic.',
      indicators: [ind1._id, ind2._id, ind3._id]
    });

    // 7. Periodo de Reporte Activo
    console.log('📅 Creando periodo de reporte activo...');
    const currentYear = new Date().getFullYear();
    await ReportPeriod.create({
      reportId: report1._id,
      semester: 'ENE-JUN',
      year: currentYear,
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 5, 30),
      dueDate: new Date(currentYear + 1, 11, 31), // Vencimiento futuro para que esté activo
      isActive: true
    });

    console.log('\n======================================================');
    console.log('🎉 ¡Base de datos inicializada exitosamente!');
    console.log('======================================================');
    console.log('👥 USUARIOS CREADOS PARA PRUEBAS:');
    console.log('------------------------------------------------------');
    console.log('1. Rol Planeación / Admin (Acceso a Indicadores, Reportes, Estadísticas):');
    console.log('   - Email:       planeacion@ittepic.edu.mx');
    console.log('   - Contraseña:  password123');
    console.log('   - Depto:       DPPP');
    console.log('------------------------------------------------------');
    console.log('2. Rol Jefe de Departamento (Acceso a Captura de Indicadores):');
    console.log('   - Email:       sistemas@ittepic.edu.mx');
    console.log('   - Contraseña:  password123');
    console.log('   - Depto:       SISTEMAS Y COMPUTACIÓN');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  }
}

seed();

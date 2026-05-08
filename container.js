import { createContainer, asClass, asValue } from "awilix";
import User from "./models/user.model.js";
import Employee from "./models/employee.model.js";
import Role from "./models/role.model.js";
import Department from "./models/department.model.js";
import UserController from "./controllers/user.controller.js";
import ResponseHandler from "./utils/handler.js";
import Position from "./models/position.model.js";
import Permission from "./models/permission.model.js";
import IndicatorDefinition from "./models/indicatorDefinition.model.js";
import IndicatorDefinitionController from "./controllers/indicatorDefinition.controller.js";
import IndicatorData from "./models/indicatorData.model.js";
import Report from "./models/report.model.js";
import ReportPeriod from "./models/reportPeriod.model.js";
import IndicatorDataController from "./controllers/indicatorData.controller.js";
import ReportController from "./controllers/report.controller.js";
import ReportPeriodController from "./controllers/reportPeriod.controller.js";
import DepartmentController from "./controllers/department.controller.js";
import StatisticsController from "./controllers/statistics.controller.js";
import StatisticsService from "./services/statistics.service.js";

const container = createContainer();

container.register({
  // Modelos
  userModel: asValue(User),
  employeeModel: asValue(Employee),
  positionModel: asValue(Position),
  roleModel: asValue(Role),
  departmentModel: asValue(Department),
  permissionModel: asValue(Permission),
  indicatorDefinitionModel: asValue(IndicatorDefinition),
  indicatorDataModel: asValue(IndicatorData),
  reportModel: asValue(Report),
  reportPeriodModel: asValue(ReportPeriod), 

  // Controladores
  userController: asClass(UserController).inject(() => ({
    User: container.resolve('userModel'),
    Employee: container.resolve('employeeModel'),
    Position: container.resolve('positionModel'),
    Role: container.resolve('roleModel'),
    Department: container.resolve('departmentModel'),
    Permission: container.resolve('permissionModel'),
  })).singleton(),

  indicatorDefinitionController: asClass(IndicatorDefinitionController).inject(() => ({
    IndicatorDefinition: container.resolve('indicatorDefinitionModel'),
  })).singleton(),

  indicatorDataController: asClass(IndicatorDataController).inject(() => ({
    IndicatorData: container.resolve('indicatorDataModel'),
  })).singleton(),

  departmentController: asClass(DepartmentController).inject(() => ({
    Department: container.resolve('departmentModel'),
  })).singleton(),

  reportController: asClass(ReportController).inject(() => ({
    Report: container.resolve('reportModel'),
    IndicatorDefinition: container.resolve('indicatorDefinitionModel'),
    IndicatorData: container.resolve('indicatorDataModel'),
  })).singleton(),

  reportPeriodController: asClass(ReportPeriodController).inject(() => ({
    ReportPeriod: container.resolve('reportPeriodModel'),
    Report: container.resolve('reportModel'),
    IndicatorDefinition: container.resolve('indicatorDefinitionModel'),
    IndicatorData: container.resolve('indicatorDataModel'),
  })).singleton(),

  statisticsController: asClass(StatisticsController).inject(() => ({
    IndicatorDefinition: container.resolve('indicatorDefinitionModel'),
    IndicatorData: container.resolve('indicatorDataModel'),
    Department: container.resolve('departmentModel'),
    User: container.resolve('userModel'),
    Employee: container.resolve('employeeModel'),
    StatisticsService: container.resolve('StatisticsService'),
  })).singleton(),

  // Utilidades
  handler: asClass(ResponseHandler).singleton(),

  // Servicios
  StatisticsService: asClass(StatisticsService).inject(() => ({
    IndicatorDefinition: container.resolve('indicatorDefinitionModel'),
    IndicatorData: container.resolve('indicatorDataModel'),
    Report: container.resolve('reportModel'),
    ReportPeriod: container.resolve('reportPeriodModel'),
  })).singleton(),


});


export default container;
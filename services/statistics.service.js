
class StatisticsService {
  constructor({ IndicatorDefinition, IndicatorData, Report, ReportPeriod }) {
    this._IndicatorDefinition = IndicatorDefinition;
    this._IndicatorData = IndicatorData;
    this._Report = Report;
    this._ReportPeriod = ReportPeriod;
  }

  async getAllIndicatorsWithData() {
    const today = new Date();

    // PASO 1: Obtener todos los periodos con sus reports poblados
    const periods = await this._ReportPeriod.find()
      .populate({
        path: 'reportId',
        populate: {
          path: 'indicators',
          populate: {
            path: 'departments'
          }
        }
      })
      .lean();

    // PASO 2: Obtener todos los datos existentes
    const allData = await this._IndicatorData.find({
      reportPeriod: { $in: periods.map(p => p._id) }
    }).populate({
      path: 'changesLog.user',
      select: 'email employeeId',
      populate: {
        path: 'employeeId',
        select: 'name grade.abbreviation'
      }
    }).lean();

    // PASO 3: Construir la estructura de respuesta solo para combinaciones reales
    const result = [];

    for (const period of periods) {
      if (!period.reportId || !Array.isArray(period.reportId.indicators)) continue;

      for (const indicator of period.reportId.indicators) {
        if (!Array.isArray(indicator.departments)) continue;

        for (const dept of indicator.departments) {
          // Buscar datos existentes para esta combinación específica
          const data = allData.find(d =>
            d.definition.toString() === indicator._id.toString() &&
            d.reportPeriod.toString() === period._id.toString() &&
            d.department.toString() === dept._id.toString()
          );

          result.push({
            definitionId: indicator._id,
            key: indicator.key,
            name: indicator.name,
            description: indicator.description,
            goal: indicator.goal,
            report: period.reportId.name,
            startDate: period.startDate,
            endDate: period.endDate,
            periodId: period._id,
            periodSemester: period.semester,
            periodYear: period.year,
            departmentId: dept._id,
            departmentName: dept.name,
            isExpired: period.dueDate < today,
            dataValue: data?.value || null,
            comments: data?.comments || null,
            changesLog: data?.changesLog || [],
            dataCreatedAt: data?.createdAt || null,
            dataUpdatedAt: data?.updatedAt || null,
            status: data
              ? 'Capturado'
              : (period.dueDate < today ? 'No capturado' : 'Pendiente')
          });
        }
      }
    }

    return result;
  }

  async getPercentageCaptured(periodIds = null, departmentIds = null, semesters = null, years = null, startDate = null, endDate = null) {
    const today = new Date();

    // Paso 1: Construir la query para periodos activos
    const query = {};
    if (!periodIds) {
      query.isActive = true;
      query.dueDate = { $gte: today };
    }
    if (periodIds) {
      query._id = Array.isArray(periodIds) ? { $in: periodIds } : periodIds;
    }
    if (semesters) query.semester = Array.isArray(semesters) ? { $in: semesters } : semesters;
    if (years) query.year = Array.isArray(years) ? { $in: years } : years;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const activePeriods = await this._ReportPeriod.find(query).lean();
    if (activePeriods.length === 0) return { percentage: 0, captured: 0, expected: 0 };

    const activePeriodIds = activePeriods.map(p => p._id);
    const activeReportIds = [...new Set(activePeriods.map(p => p.reportId))]; // Unique report IDs

    // Paso 2: Obtener reports y mapear indicadores por reportId
    const reports = await this._Report.find({ _id: { $in: activeReportIds } }).lean();
    const reportIndicatorsMap = reports.reduce((acc, report) => {
      acc[report._id.toString()] = report.indicators || [];
      return acc;
    }, {});

    // Paso 3: Calcular totalExpectedCaptures considerando cada periodo
    let totalExpectedCaptures = 0;
    const definitionsQuery = { _id: { $in: Object.values(reportIndicatorsMap).flat() } };
    if (departmentIds) {
      definitionsQuery.departments = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }

    const definitions = await this._IndicatorDefinition.find(definitionsQuery).lean();
    const definitionDeptsMap = definitions.reduce((acc, def) => {
      acc[def._id.toString()] = def.departments || [];
      return acc;
    }, {});

    for (const period of activePeriods) {
      const reportId = period.reportId.toString();
      const indicatorIds = reportIndicatorsMap[reportId] || [];

      for (const indicatorId of indicatorIds) {
        const depts = definitionDeptsMap[indicatorId.toString()] || [];
        if (departmentIds) {
          const hasDept = depts.some(d =>
            Array.isArray(departmentIds)
              ? departmentIds.includes(d.toString())
              : d.toString() === departmentIds
          );
          if (hasDept) totalExpectedCaptures += 1;
        } else {
          totalExpectedCaptures += depts.length;
        }
      }
    }

    // Paso 4: Contar capturas reales
    const capturedQuery = {
      reportPeriod: { $in: activePeriodIds },
    };
    if (departmentIds) {
      capturedQuery.department = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }
    const capturedCount = await this._IndicatorData.countDocuments(capturedQuery);

    return {
      percentage: totalExpectedCaptures === 0 ? 0 : Math.round((capturedCount / totalExpectedCaptures) * 100),
      captured: capturedCount,
      expected: totalExpectedCaptures,
    };
  }

  async getLastUpdate(periodIds = null, departmentIds = null, semesters = null, years = null, startDate = null, endDate = null) {
    const today = new Date();

    // Paso 1: Filtrar periodos activos y no expirados
    const periodQuery = {
      isActive: true,
      // dueDate: { $gte: today }
    };

    if (periodIds) {
      periodQuery._id = Array.isArray(periodIds) ? { $in: periodIds } : periodIds;
    }

    if (semesters) {
      periodQuery.semester = Array.isArray(semesters) ? { $in: semesters } : semesters;
    }

    if (years) {
      periodQuery.year = Array.isArray(years) ? { $in: years } : years;
    }

    if (startDate) {
      periodQuery.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      periodQuery.endDate = { $lte: new Date(endDate) };
    }

    const activePeriods = await this._ReportPeriod.find(periodQuery).lean();
    if (activePeriods.length === 0) return null;

    const activePeriodIds = activePeriods.map(p => p._id);

    // Paso 2: Construir query para IndicatorData
    const dataQuery = {
      reportPeriod: { $in: activePeriodIds }
    };

    if (departmentIds) {
      dataQuery.department = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }

    // Paso 3: Buscar el último dato actualizado con los filtros aplicados
    const lastData = await this._IndicatorData
      .findOne(dataQuery)
      .sort({ updatedAt: -1 })
      .populate('definition')
      .populate({
        path: 'reportPeriod',
        populate: {
          path: 'reportId',
          select: 'name'
        }
      })
      .populate('department', 'name')
      .populate({
        path: 'changesLog.user',
        select: 'email employeeId',
        populate: {
          path: 'employeeId',
          select: 'name grade.abbreviation'
        }
      })
      .lean();

    return lastData;
  }

  async getCaptureProgressByDepartment(limit = 4, periodIds = null, departmentIds = null, semesters = null, years = null, startDate = null, endDate = null) {
    const today = new Date();

    // PASO 1: Construir query para periodos activos con posibles filtros
    const periodQuery = {};

    if (!periodIds) {
      periodQuery.isActive = true;
      periodQuery.dueDate = { $gte: today };
    }

    if (periodIds) {
      periodQuery._id = Array.isArray(periodIds) ? { $in: periodIds } : periodIds;
    }

    if (semesters) {
      periodQuery.semester = Array.isArray(semesters) ? { $in: semesters } : semesters;
    }

    if (years) {
      periodQuery.year = Array.isArray(years) ? { $in: years } : years;
    }

    if (startDate) {
      periodQuery.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      periodQuery.endDate = { $lte: new Date(endDate) };
    }

    const activePeriods = await this._ReportPeriod.find(periodQuery).lean();

    if (activePeriods.length === 0) {
      return {
        total: 0,
        byDepartments: []
      };
    }

    const activePeriodIds = activePeriods.map(p => p._id);
    const activeReportIds = [...new Set(activePeriods.map(p => p.reportId))]; // Unique report IDs

    // PASO 2: Obtener reports y mapear indicadores por reportId
    const reports = await this._Report.find({ _id: { $in: activeReportIds } }).lean();
    const reportIndicatorsMap = reports.reduce((acc, report) => {
      acc[report._id.toString()] = report.indicators || [];
      return acc;
    }, {});

    // PASO 3: Obtener definiciones con departamentos (aplicando filtro de departamento si existe)
    const allIndicatorIds = Object.values(reportIndicatorsMap).flat();
    const definitionsQuery = { _id: { $in: allIndicatorIds } };

    if (departmentIds) {
      definitionsQuery.departments = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }

    const definitions = await this._IndicatorDefinition.find(definitionsQuery)
      .populate('departments', 'name shortName')
      .lean();

    // PASO 4: Construir mapa total esperado por departamento
    const deptMap = new Map();

    for (const period of activePeriods) {
      const reportId = period.reportId.toString();
      const indicatorIds = reportIndicatorsMap[reportId] || [];

      for (const indicatorId of indicatorIds) {
        const definition = definitions.find(def => def._id.toString() === indicatorId.toString());
        if (!definition || !Array.isArray(definition.departments)) continue;

        for (const dept of definition.departments) {
          const deptId = dept._id.toString();

          // Si hay filtro de departamento, solo incluimos esos departamentos
          if (departmentIds) {
            const shouldInclude = Array.isArray(departmentIds)
              ? departmentIds.includes(deptId)
              : deptId === departmentIds.toString();

            if (!shouldInclude) continue;
          }

          if (!deptMap.has(deptId)) {
            deptMap.set(deptId, {
              departmentId: deptId,
              departmentName: dept.name,
              departmentShortName: dept.shortName,
              total: 0,
              captured: 0
            });
          }

          deptMap.get(deptId).total += 1; // Cada (periodo + indicador + departamento) cuenta como 1
        }
      }
    }

    // PASO 5: Contar capturas reales por departamento
    const dataQuery = {
      reportPeriod: { $in: activePeriodIds },
    };

    if (departmentIds) {
      dataQuery.department = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }

    const dataEntries = await this._IndicatorData.find(dataQuery)
      .select('department')
      .lean();

    for (const data of dataEntries) {
      const deptId = data.department?.toString();
      if (!deptId) continue;

      const entry = deptMap.get(deptId);
      if (entry) {
        entry.captured += 1;
      }
    }

    // PASO 6: Formatear progreso
    const progressList = Array.from(deptMap.values()).map(d => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      departmentShortName: d.departmentShortName,
      percentage: d.total === 0 ? 0 : Math.round((d.captured / d.total) * 100),
      pending: d.total - d.captured,
      total: d.total,
      captured: d.captured
    }));

    const totalPending = progressList.reduce((sum, d) => sum + d.pending, 0);

    const allComplete = progressList.every(d => d.percentage === 100);
    const filtered = allComplete
      ? progressList
      : progressList.filter(d => d.percentage < 100);

    // PASO 7: Ordenar y limitar resultados
    const sorted = filtered
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, limit);

    return {
      total: totalPending,
      byDepartments: sorted
    };
  }

  async getStatisticsIndicatorData(periodIds = null, departmentIds = null, semesters = null, years = null, startDate = null, endDate = null) {
    // Construir la query para los periodos
    const periodQuery = {};

    if (periodIds) {
      periodQuery._id = Array.isArray(periodIds) ? { $in: periodIds } : periodIds;
    }

    if (semesters) {
      periodQuery.semester = Array.isArray(semesters) ? { $in: semesters } : semesters;
    }

    if (years) {
      periodQuery.year = Array.isArray(years) ? { $in: years } : years;
    }

    if (startDate) {
      periodQuery.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      periodQuery.endDate = { $lte: new Date(endDate) };
    }

    // Obtener los IDs de periodos que coincidan con los filtros
    const periods = await this._ReportPeriod.find(periodQuery).lean();

    if (periods.length === 0) {
      return [];
    }

    const periodIdsFilter = periodQuery._id ?
      (Array.isArray(periodIds) ? periodIds : [periodIds]) :
      periods.map(p => p._id);

    // Construir la query para IndicatorData
    const dataQuery = {
      reportPeriod: { $in: periodIdsFilter }
    };

    if (departmentIds) {
      dataQuery.department = Array.isArray(departmentIds) ? { $in: departmentIds } : departmentIds;
    }

    const data = await this._IndicatorData.find(dataQuery)
      .select('-changesLog -__v -comments -createdAt -updatedAt')
      .populate('definition', '-__v -createdAt -updatedAt -description -departments')
      .populate({
        path: 'reportPeriod',
        select: 'startDate endDate semester year',
        populate: {
          path: 'reportId',
          select: 'name'
        }
      })
      .populate('department', 'name shortName')
      .lean();

    return data || [];
  }

}

export default StatisticsService;

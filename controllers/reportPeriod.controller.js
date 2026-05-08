import status from 'http-status';

class ReportPeriodController {
  constructor({ ReportPeriod, IndicatorData }) {
    this._reportPeriod = ReportPeriod;
    this._indicatorData = IndicatorData;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllByDepartment = this.getAllByDepartment.bind(this);
    this.getAllInfoNoExpired = this.getAllInfoNoExpired.bind(this);
    this.getAllInfo = this.getAllInfo.bind(this);
    this.getAllNoExpired = this.getAllNoExpired.bind(this);
    this.getAllNoExpiredByDepartment = this.getAllNoExpiredByDepartment.bind(this);
    this.getAllWithCapturedIndicators = this.getAllWithCapturedIndicators.bind(this);
    this.getAllWithCapturedIndicatorsByDepartment = this.getAllWithCapturedIndicatorsByDepartment.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
  }

  async create(req, res) {
    try {
      const data = req.body;

      // Convertir fechas a inicio de día para ignorar la hora
      const startOfStartDate = new Date(data.startDate);
      startOfStartDate.setHours(0, 0, 0, 0);

      const startOfEndDate = new Date(data.endDate);
      startOfEndDate.setHours(0, 0, 0, 0);

      // Validar si ya existe un periodo duplicado
      const existing = await this._reportPeriod.findOne({
        reportId: data.reportId,
        year: data.year,
        semester: data.semester,
        startDate: {
          $gte: startOfStartDate,
          $lt: new Date(startOfStartDate.getTime() + 24 * 60 * 60 * 1000) // Día siguiente
        },
        endDate: {
          $gte: startOfEndDate,
          $lt: new Date(startOfEndDate.getTime() + 24 * 60 * 60 * 1000) // Día siguiente
        }
      });

      if (existing) {
        return res.status(status.CONFLICT).json({ error: 'Ya existe un período para este reporte' });
      }

      const newPeriod = await this._reportPeriod.create(data);
      res.status(status.CREATED).json(newPeriod);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al crear el período de captura' });
    }
  }

  async getAll(req, res) {
    try {
      const periods = await this._reportPeriod.find()
        .populate({
          path: 'reportId',
          populate: {
            path: 'indicators',
            populate: {
              path: 'departments',
              select: 'name'
            }
          }
        });
      res.status(status.OK).json(periods);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura'
      });
    }
  }

  async getAllByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      const periods = await this._reportPeriod.find()
        .populate({
          path: 'reportId',
          populate: {
            path: 'indicators',
            populate: {
              path: 'departments',
              select: 'name'
            }
          }
        });

      const filteredPeriods = periods
        .map(period => {
          const indicators = period.reportId?.indicators || [];

          // Filtrar indicadores del departamento solicitado
          const filteredIndicators = indicators.filter(indicator =>
            indicator.departments.some(dept => String(dept._id) === String(departmentId))
          );

          // Clonar periodo para no mutar original
          const periodObj = period.toObject();
          periodObj.reportId.indicators = filteredIndicators;

          return periodObj;
        })
        // Opcional: excluir períodos sin indicadores filtrados
        .filter(period => period.reportId.indicators.length > 0);

      res.status(status.OK).json(filteredPeriods);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura por departamento'
      });
    }
  }

  async getAllNoExpired(req, res) {
    try {
      const periods = await this._reportPeriod.find({ isActive: true })
        .populate({
          path: 'reportId',
          populate: {
            path: 'indicators',
            populate: {
              path: 'departments',
              select: 'name'
            }
          }
        });
      const activePeriods = periods.filter(period => !period.isExpired);
      res.status(status.OK).json(activePeriods);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura'
      });
    }
  }

  async getAllInfoNoExpired(req, res) {
    try {
      const periods = await this._reportPeriod.find({ isActive: true })
        .select("_id semester year dueDate")
        .populate('reportId', 'name');
      const activePeriods = periods.filter(period => !period.isExpired);

      const formatted = activePeriods.map(period => ({
        _id: period._id,
        semester: period.semester,
        year: period.year,
        reportName: `${period.reportId.name} [${period.semester}${period.year}]`,
      }));
      
      res.status(status.OK).json(formatted);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura'
      });
    }
  }

  async getAllInfo(req, res) {
    try {
      const periods = await this._reportPeriod.find({})
        .select("_id semester year dueDate isActive")
        .populate('reportId', 'name');

      const formatted = periods.map(period => ({
        _id: period._id,
        semester: period.semester,
        year: period.year,
        reportName: `${period.reportId.name} [${period.semester}${period.year}]`,
        isExpired: period.isExpired,
        isActive: period.isActive
      }));
      
      res.status(status.OK).json(formatted);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura'
      });
    }
  }

  async getAllNoExpiredByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      const periods = await this._reportPeriod.find({ isActive: true })
        .populate({
          path: 'reportId',
          populate: {
            path: 'indicators',
            populate: {
              path: 'departments',
              select: 'name'
            }
          }
        });

      const filteredPeriods = periods
        .filter(period => !period.isExpired)
        .map(period => {
          const indicators = period.reportId?.indicators || [];

          // Filtrar indicadores del departamento solicitado
          const filteredIndicators = indicators.filter(indicator =>
            indicator.departments.some(dept => String(dept._id) === String(departmentId))
          );

          // Clonar periodo para no mutar original
          const periodObj = period.toObject();
          periodObj.reportId.indicators = filteredIndicators;

          return periodObj;
        })
        // Opcional: excluir períodos sin indicadores filtrados
        .filter(period => period.reportId.indicators.length > 0);

      res.status(status.OK).json(filteredPeriods);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener los períodos de captura por departamento'
      });
    }
  }

  async getAllWithCapturedIndicators(req, res) {
    try {
      const capturedData = await this._indicatorData.find().distinct('reportPeriod');

      const periods = await this._reportPeriod.find({
        _id: { $in: capturedData }
      })
        .populate({
          path: 'reportId',
          populate: {
            path: 'indicators',
            populate: {
              path: 'departments',
              select: 'name'
            }
          }
        });

      res.status(status.OK).json(periods);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener períodos con indicadores capturados'
      });
    }
  }

  async getAllWithCapturedIndicatorsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      const capturedPeriods = await this._indicatorData.find({ department: departmentId }).distinct('reportPeriod');

      const periods = await this._reportPeriod.find({
        _id: { $in: capturedPeriods }
      }).populate({
        path: 'reportId',
        populate: {
          path: 'indicators',
          populate: {
            path: 'departments',
            select: 'name'
          }
        }
      });

      res.status(status.OK).json(periods);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener períodos con indicadores capturados por departamento'
      });
    }
  }


  async getById(req, res) {
    try {
      const { id } = req.params;
      const period = await this._reportPeriod.findById(id)
        .populate('reportId', 'name');

      if (!period) {
        return res.status(status.NOT_FOUND).json({ error: 'Período de captura no encontrado' });
      }

      res.status(status.OK).json(period);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener el período de captura' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await this._reportPeriod.findByIdAndUpdate(id, data, { new: true });
      if (!updated) {
        return res.status(status.NOT_FOUND).json({ error: 'Período de captura no encontrado' });
      }

      res.status(status.OK).json(updated);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al actualizar el período de captura' });
    }
  }

}

export default ReportPeriodController;

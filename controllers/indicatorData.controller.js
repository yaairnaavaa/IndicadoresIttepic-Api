import status from 'http-status';

class IndicatorDataController {
  constructor({ IndicatorData }) {
    this._data = IndicatorData;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getByDefinition = this.getByDefinition.bind(this);
    this.getByReportPeriod = this.getByReportPeriod.bind(this);
    this.getByReportPeriodAndDepartment = this.getByReportPeriodAndDepartment.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getByDepartment = this.getByDepartment.bind(this);
  }

  async create(req, res) {
    try {
      const data = req.body;

      data.capturedBy = req.user.userId;
      data.changesLog = [{
        user: req.user.userId,
        date: new Date()
      }];

      const newData = await this._data.create(data);
      res.status(status.CREATED).json(newData);
    } catch (error) {

      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al capturar datos del indicador' });
    }
  }

  async getAll(req, res) {
    try {
      const entries = await this._data.find()
        .populate({ path: 'definition', populate: { path: 'departments', select: 'name' } })
        .populate({ path: 'reportPeriod', populate:{ path: 'reportId', select: 'name' } })
        .populate('department', 'name')
        .populate('changesLog.user', 'email');

      res.status(status.OK).json(entries);
    } catch (error) {
      // console.error('Error en getAll:', error);
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener los datos capturados' });
    }
  }

  async getByDefinition(req, res) {
    try {
      const { definitionId } = req.params;
      const entries = await this._data.find({ indicatorDefinition: definitionId })
        .populate('capturedBy', 'email')
        .populate('changesLog.user', 'email');

      if (!entries.length) {
        return res.status(status.NOT_FOUND).json({ error: 'No hay datos capturados para esta definición' });
      }

      res.status(status.OK).json(entries);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener datos por definición' });
    }
  }

  async getByReportPeriod(req, res) {
    try {
      const { reportPeriodId } = req.params;
      const entries = await this._data.find({ reportPeriod: reportPeriodId })
        .populate('definition')
        .populate('reportPeriod')
        .populate('department')

      res.status(status.OK).json(entries);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener datos por período' });
    }
  }

  async getByReportPeriodAndDepartment(req, res) {
    try {
      const { reportPeriodId, departmentId } = req.params;

      const entries = await this._data.find({
        reportPeriod: reportPeriodId,
        department: departmentId
      })
        .populate('definition')
        .populate('reportPeriod')
        .populate('department')

      res.status(status.OK).json(entries);
    } catch (error) {
      // console.error('Error en getByReportPeriodAndDepartment:', error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener datos por período y departamento'
      });
    }
  }


  async getByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      const entries = await this._data.find({ department: departmentId })
        .populate({ path: 'definition', populate: { path: 'departments', select: 'name' } })
        .populate({ path: 'reportPeriod', populate:{ path: 'reportId', select: 'name' } })
        .populate('department', 'name')
        .populate('changesLog.user', 'email');

      res.status(status.OK).json(entries);
    } catch (error) {
      // console.error('Error en getByDepartment:', error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al obtener datos por departamento'
      });
    }
  }


  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const entry = await this._data.findById(id);
      if (!entry) {
        return res.status(status.NOT_FOUND).json({ error: 'Dato no encontrado' });
      }

      Object.assign(entry, data);
      entry.changesLog.push({
        user: req.user.userId,
        date: new Date()
      });

      await entry.save();
      res.status(status.OK).json(entry);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al actualizar el dato capturado' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this._data.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(status.NOT_FOUND).json({ error: 'Dato no encontrado' });
      }

      res.status(status.OK).json({ message: 'Dato eliminado' });
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al eliminar el dato' });
    }
  }
}

export default IndicatorDataController;

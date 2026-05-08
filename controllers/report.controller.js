import { populate } from 'dotenv';
import status from 'http-status';

class ReportController {
  constructor({ Report }) {
    this._report = Report;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
  }

  async create(req, res) {
    try {
      const data = req.body;
      const newGroup = await this._report.create(data);
      res.status(status.CREATED).json(newGroup);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al crear el grupo de reporte' });
    }
  }

  async getAll(req, res) {
    try {
      const groups = await this._report.find()
        .populate({ path: 'indicators', populate: 'departments' });
      res.status(status.OK).json(groups);
    } catch (error) {
      // console.log(error);
      
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener los grupos de reporte' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const group = await this._report.findById(id)
        .populate({ path: 'indicators', populate: 'departments' });

      if (!group) {
        return res.status(status.NOT_FOUND).json({ error: 'Grupo de reporte no encontrado' });
      }

      res.status(status.OK).json(group);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener el grupo de reporte' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await this._report.findByIdAndUpdate(id, data, { new: true });
      if (!updated) {
        return res.status(status.NOT_FOUND).json({ error: 'Grupo de reporte no encontrado' });
      }

      res.status(status.OK).json(updated);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al actualizar el grupo de reporte' });
    }
  }

  
}

export default ReportController;

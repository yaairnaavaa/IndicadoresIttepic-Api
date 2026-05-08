import status from "http-status";

class StatisticsController {
  constructor({ StatisticsService }) {
    this._statisticsService = StatisticsService;

    this.getIndicatorsWithData = this.getIndicatorsWithData.bind(this);
    this.getPercentageCaptured = this.getPercentageCaptured.bind(this);
    this.getLastUpdate = this.getLastUpdate.bind(this);
    this.getCaptureProgressByDepartment = this.getCaptureProgressByDepartment.bind(this);
    this.getStatisticsIndicatorData = this.getStatisticsIndicatorData.bind(this);
  }

  async getIndicatorsWithData(req, res) {
    try {
      const result = await this._statisticsService.getAllIndicatorsWithData();
      res.status(status.OK).json(result);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: "Error al obtener los reportes" });
    }
  }

  async getPercentageCaptured(req, res) {
    try {
      const { periodId, departmentId, semester, year, startDate, endDate } = req.query;

      // Convertir parámetros que pueden ser múltiples a arrays si vienen como strings separados por comas
      const periodIds = this._parseMultipleValues(periodId);
      const departmentIds = this._parseMultipleValues(departmentId);
      const semesters = this._parseMultipleValues(semester);
      const years = this._parseMultipleValues(year, true);

      const percentage = await this._statisticsService.getPercentageCaptured(
        periodIds,
        departmentIds,
        semesters,
        years,
        startDate || null,
        endDate || null
      );

      res.status(status.OK).json(percentage);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al calcular el porcentaje de captura' });
    }
  }

  async getLastUpdate(req, res) {
    try {
      const { periodId, departmentId, semester, year, startDate, endDate } = req.query;

      // Convertir parámetros que pueden ser múltiples a arrays si vienen como strings separados por comas
      const periodIds = this._parseMultipleValues(periodId);
      const departmentIds = this._parseMultipleValues(departmentId);
      const semesters = this._parseMultipleValues(semester);
      const years = this._parseMultipleValues(year, true);

      const result = await this._statisticsService.getLastUpdate(
        periodIds,
        departmentIds,
        semesters,
        years,
        startDate || null,
        endDate || null
      );

      res.status(status.OK).json(result);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener la última actualización' });
    }
  }

  async getCaptureProgressByDepartment(req, res) {
    try {
      const {
        limit,
        periodId,
        departmentId,
        semester,
        year,
        startDate,
        endDate
      } = req.query;

      // Convertir parámetros que pueden ser múltiples a arrays si vienen como strings separados por comas
      const periodIds = this._parseMultipleValues(periodId);
      const departmentIds = this._parseMultipleValues(departmentId);
      const semesters = this._parseMultipleValues(semester);
      const years = this._parseMultipleValues(year, true);

      const result = await this._statisticsService.getCaptureProgressByDepartment(
        limit ? parseInt(limit) : 4,
        periodIds,
        departmentIds,
        semesters,
        years,
        startDate || null,
        endDate || null
      );

      res.status(status.OK).json(result);
    } catch (error) {
      console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: "Error al obtener el progreso de captura por departamento"
      });
    }
  }

  async getStatisticsIndicatorData(req, res) {
    try {
      const { periodId, departmentId, semester, year, startDate, endDate } = req.query;

      // Convertir parámetros que pueden ser múltiples a arrays si vienen como strings separados por comas
      const periodIds = this._parseMultipleValues(periodId);
      const departmentIds = this._parseMultipleValues(departmentId);
      const semesters = this._parseMultipleValues(semester);
      const years = this._parseMultipleValues(year, true);

      const result = await this._statisticsService.getStatisticsIndicatorData(
        periodIds,
        departmentIds,
        semesters,
        years,
        startDate || null,
        endDate || null
      );

      res.status(status.OK).json(result);
    } catch (error) {
      // console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: "Error al obtener datos filtrados de indicadores"
      });
    }
  }

  /**
   * Método auxiliar para parsear valores que pueden ser múltiples
   * @param {string|string[]} value - Valor a parsear
   * @param {boolean} [toNumber=false] - Si se debe convertir a número
   * @returns {string[]|number[]|null} - Array de valores o null si no hay valor
   */
  _parseMultipleValues(value, toNumber = false) {
    if (!value) return null;
    if (Array.isArray(value)) return toNumber ? value.map(Number) : value;

    // Si es un string separado por comas
    const values = value.split(',').map(v => v.trim());

    return toNumber
      ? values.map(Number).filter(v => !isNaN(v))
      : values.filter(v => v !== '');
  }
}

export default StatisticsController;
import status from "http-status";

class DepartmentController {
  constructor({ Department }) {
    this._department = Department;

    this.getAll = this.getAll.bind(this);
  }

  async getAll(req, res) {
    try {
      const departments = await this._department.find().select('-careers');;
      res.status(status.OK).json(departments);
    } catch (error) {
      // console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: "Error al obtener los departamentos" });
    }
  }

}  

export default DepartmentController;
import status from 'http-status';

class IndicatorDefinitionController {
  constructor({ IndicatorDefinition }) {
    this._definition = IndicatorDefinition;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.getByDepartments = this.getByDepartments.bind(this);
    this.update = this.update.bind(this);
    this.bulkCreate = this.bulkCreate.bind(this);
    this.checkExisting = this.checkExisting.bind(this);
  }

  async create(req, res) {
    try {
      const data = req.body;
      
      // Verificar si ya existe un indicador con la misma clave
      const existingDefinition = await this._definition.findOne({ key: data.key });
      
      if (existingDefinition) {
        return res.status(status.CONFLICT).json({ 
          error: 'La clave ya existe en la base de datos',
          duplicateKey: data.key
        });
      }

      const newDefinition = await this._definition.create(data);
      res.status(status.CREATED).json(newDefinition);
    } catch (error) {
      // Manejar errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        return res.status(status.BAD_REQUEST).json({ 
          error: 'Datos de entrada inválidos',
          details: error.message 
        });
      }
      
      // console.error(error);
      res.status(status.INTERNAL_SERVER_ERROR).json({ 
        error: 'Error al crear la definición del indicador',
        details: error.message 
      });
    }
  }

  async getAll(req, res) {
    try {
      const definitions = await this._definition.find()
        .populate({ path: 'departments', select: '-careers' });
      res.status(status.OK).json(definitions);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener las definiciones de indicadores' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const definition = await this._definition.findById(id)
        .populate({ path: 'departments', select: '-careers' });

      if (!definition) {
        return res.status(status.NOT_FOUND).json({ error: 'Definición no encontrada' });
      }

      res.status(status.OK).json(definition);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Error al obtener la definición' });
    }
  }

  async getByDepartments(req, res) {
    try {
      const { departments } = req.body;

      if (!Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({ message: 'Debes enviar al menos un ID de departamento en un arreglo.' });
      }

      const indicators = await this._definition.find({
        departments: { $in: departments }
      }).populate('departments');

      res.json(indicators);
    } catch (error) {
      console.error('Error al buscar indicadores por departamento:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Verificar si la nueva clave ya existe en otro documento (excepto el actual)
      if (data.key) {
        const existingWithSameKey = await this._definition.findOne({ 
          key: data.key, 
          _id: { $ne: id } 
        });
        
        if (existingWithSameKey) {
          return res.status(status.CONFLICT).json({ 
            error: 'La clave ya existe en otro indicador',
            duplicateKey: data.key
          });
        }
      }

      const updated = await this._definition.findByIdAndUpdate(id, data, { 
        new: true,
        runValidators: true 
      }).populate({ path: 'departments', select: '-careers' });
      
      if (!updated) {
        return res.status(status.NOT_FOUND).json({ error: 'Definición no encontrada' });
      }

      res.status(status.OK).json(updated);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(status.BAD_REQUEST).json({ 
          error: 'Datos de entrada inválidos',
          details: error.message 
        });
      }
      
      res.status(status.INTERNAL_SERVER_ERROR).json({ 
        error: 'Error al actualizar la definición',
        details: error.message 
      });
    }
  }

  async bulkCreate(req, res) {
    try {
      const data = req.body;

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(status.BAD_REQUEST).json({ error: 'Se requiere un arreglo no vacío de definiciones de indicadores' });
      }

      // Obtener todas las keys del request
      const keys = data.map(item => item.key);

      // Buscar definiciones existentes con las mismas keys
      const existingDefinitions = await this._definition.find({
        key: { $in: keys }
      });

      if (existingDefinitions.length > 0) {
        // Extraer las keys duplicadas
        const duplicateKeys = existingDefinitions.map(def => def.key);
        return res.status(status.CONFLICT).json({
          error: 'Algunas claves ya existen en la base de datos',
          duplicateKeys
        });
      }

      const createdDefinitions = await this._definition.insertMany(data);

      res.status(status.CREATED).json(createdDefinitions);
    } catch (error) {
      // console.error('Error en bulkCreate:', error);

      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al crear múltiples definiciones de indicadores',
        details: error.message
      });
    }
  }

  async checkExisting(req, res) {
    try {
      const { keys } = req.body;

      if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(status.BAD_REQUEST).json({ error: 'Se requiere un arreglo de claves para verificar' });
      }

      const existingDefinitions = await this._definition.find({
        key: { $in: keys }
      }).populate({ path: 'departments', select: '-careers' });

      res.status(status.OK).json(existingDefinitions);
    } catch (error) {
      // console.error('Error en checkExisting:', error);
      res.status(status.INTERNAL_SERVER_ERROR).json({
        error: 'Error al verificar indicadores existentes',
        details: error.message
      });
    }
  }
}

export default IndicatorDefinitionController;
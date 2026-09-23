import jwt from 'jsonwebtoken';
import status from 'http-status';
import config from '../config.js';
import ResponseHandler from '../utils/handler.js';

class UserController {

    constructor({ User, Employee, Position, Role }) {
        this._user = User;
        this._employee = Employee;
        this._position = Position;
        this._role = Role;

        this.login = this.login.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getUser = this.getUser.bind(this);
        this.getDataEmployee = this.getDataEmployee.bind(this);
        this.updatePassword = this.updatePassword.bind(this);
        this.isAuthenticated = this.isAuthenticated.bind(this);
        this.logout = this.logout.bind(this);
    }

    async login(req, res) {
        try {
            const { email, password, rememberMe } = this._sanitizeCredentials(req.body);

            if (!this._isValidEmail(email) || !password.trim()) {
                return this._invalidCredentialsResponse(res);
            }

            const user = await this._findUser({ email });
            if (!user) {
                return this._invalidCredentialsResponse(res);
            }

            user.validatePasswd(password, user.password, async (invalid) => {
                if (invalid) {
                    return this._invalidCredentialsResponse(res);
                }

                const employee = await this._getEmployeeData(user.employeeId._id);

                if (!this._hasRelevantPosition(employee)) {
                    return res.status(status.FORBIDDEN).json({
                        error: 'El usuario no cuenta con un puesto autorizado para acceder al sistema.'
                    });
                }

                // Tiempo de expiración basado en rememberMe
                const expiresIn = rememberMe ? '30d' : '8h';
                const token = jwt.sign({
                    email: user.email,
                    userId: user._id,
                    rememberMe
                }, config.secret, { expiresIn });

                const formatUser = await this._formatUser(employee, user);

                const isProduction = process.env.NODE_ENV === 'production';

                return res.cookie('token', token, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? 'none' : 'lax',
                    partitioned: isProduction,
                    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined // 30 días en ms
                }).json({ user: formatUser });
            });

        } catch (error) {
            return res.status(status.INTERNAL_SERVER_ERROR).json({
                error: 'Error interno del servidor.'
            });
        }
    }

    isAuthenticated(req, res) {
        try {
            const token = req.cookies.token;

            if (!token) {
                return res.status(status.OK).json({ user: null });
            }

            jwt.verify(token, config.secret, async (err, decoded) => {
                if (err) {
                    return res.status(status.OK).json({ user: null });
                }

                // Verificar si el token es de un dispositivo recordado
                const isRememberedDevice = decoded.rememberMe;

                const user = await this._findUser({ email: decoded.email });

                if (!user) {
                    return res.status(status.NOT_FOUND).json({ error: 'Usuario no encontrado.' });
                }

                const employee = await this._getEmployeeData(user.employeeId._id);

                if (!employee) {
                    return res.status(status.NOT_FOUND).json({ error: 'Empleado no encontrado.' });
                }

                const formatUser = await this._formatUser(employee, user);

                return res.status(status.OK).json({
                    user: formatUser,
                    isRememberedDevice
                });
            });
        } catch (error) {
            return res.status(status.INTERNAL_SERVER_ERROR).json({
                error: 'Error interno del servidor al verificar la sesión.'
            });
        }
    }


    logout(req, res) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            partitioned: isProduction,
        });
        return res.json({ message: 'Sesión cerrada' });
    }

    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(status.BAD_REQUEST).json({
                    error: 'La contraseña actual y la nueva contraseña son requeridas.'
                });
            }

            const token = req.cookies.token;
            if (!token) {
                return res.status(status.UNAUTHORIZED).json({
                    error: 'Token no proporcionado.'
                });
            }

            const decoded = jwt.verify(token, config.secret);
            const email = decoded.email;

            const user = await this._findUser({ email });

            if (!user) {
                return res.status(status.NOT_FOUND).json({
                    error: 'Usuario no encontrado.'
                });
            }

            // Verificar la contraseña actual
            user.validatePasswd(currentPassword, user.password, async (invalid) => {
                if (invalid) {
                    return res.status(status.FORBIDDEN).json({
                        error: 'La contraseña actual es incorrecta.'
                    });
                }

                // Actualizar la contraseña
                user.password = newPassword; // Asumiendo que tienes un middleware que hashea el password antes de guardar
                await user.save();

                return res.status(status.OK).json({
                    message: 'Contraseña actualizada exitosamente.'
                });
            });

        } catch (error) {
            // console.error('Error al actualizar contraseña:', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json({
                error: 'Error interno del servidor.'
            });
        }
    }

    async getUser(req, res) {
        const data = req.params.employeeId;
        const query = { employeeId: data };
        const user = await this._findUser(query);
        if (user) {
            return res.status(200).json(user);
        } else {
            return res.status(status.NOT_FOUND).json({
                error: 'No existe el usuario'
            });
        }
    }

    async getAll(req, res) {
        try {
            const users = await this._user.find({}).select({ password: 0 }).exec();
            ResponseHandler.handleMany('users', res, null, users);
        } catch (error) {
            ResponseHandler.handleMany('users', res, error, null);
        }

    }

    async getDataEmployee(req, res) {
        const { email } = req.params;
        const query = { email: email };

        try {
            const user = await this._user.findOne(query)
                .populate({
                    path: 'employeeId',
                    model: 'Employee',
                    select: { grade: 0, birthdate: 0, curp: 0 },
                    populate: {
                        path: 'positions.position',
                        model: 'Position',
                        select: '-documents',
                        populate: { path: 'ascription', model: 'Department' }
                    }
                }).exec();

            if (user) {
                const employeeData = user.employeeId.toObject();

                const activePositions = employeeData.positions.filter(({ status }) => status === 'ACTIVE');

                let _positions = [];
                for (const item of activePositions) {
                    const _position = item.position;
                    if (_position && _position.isRelevantToIndicators) {
                        if (_position.role) {
                            _position.role = await this._getRoleById(_position.role);
                        }
                        _positions.push(_position);
                    }
                }

                employeeData.positions = _positions.slice();

                return res.status(status.OK).json({ employee: employeeData });
            } else {
                return res.status(status.NOT_FOUND).json({
                    status: status.NOT_FOUND,
                    error: 'No lo encontró'
                });
            }
        } catch (error) {
            return res.status(status.INTERNAL_SERVER_ERROR).json({
                status: status.INTERNAL_SERVER_ERROR,
                error: error.toString()
            });
        }
    }


    _findUser(query) {

        return new Promise((resolve) => {
            this._user.findOne(query)
                .populate({ path: 'employeeId', model: 'Employee', select: { name: 1, _id: 1 } })
                .then((user) => resolve(user))
                .catch((_) => resolve(null));
        });
    }

    _getRoleById(roleId) {
        return new Promise((resolve) => {
            this._role.findOne({ _id: roleId })
                .populate({ path: 'permissions', model: 'Permission', select: '-_id' })
                .select('-description -_id')
                .then((role) => resolve(role))
                .catch((_) => resolve(null));
        });
    }

    _sanitizeCredentials({ email, password, rememberMe }) {
        return {
            email: (email || '').toString().trim(),
            password: (password || '').toString().trim(),
            rememberMe: !!rememberMe // Convertir a booleano
        };
    }

    _isValidEmail(email) {
        return /.@./.test(email) && /.@ittepic.edu.mx$/.test(email);
    }

    _invalidCredentialsResponse(res) {
        return res.status(status.NOT_FOUND).json({
            error: 'Usuario y/o contraseña incorrectos'
        });
    }

    async _getEmployeeData(employeeId) {
        return this._employee.findById(employeeId)
            .populate({
                path: 'positions.position',
                populate: {
                    path: 'ascription',
                    model: 'Department',
                    select: 'name'
                }
            });
    }

    _hasRelevantPosition(employee) {
        return employee.positions.some(pos =>
            pos.status === 'ACTIVE' &&
            pos.position &&
            pos.position.isRelevantToIndicators
        );
    }

    async _formatUser(employee, user) {
        const GenderMap = {
            masculino: 'male',
            femenino: 'female'
        };

        const activePosition = employee.positions.find(pos =>
            pos.status === 'ACTIVE' &&
            pos.position &&
            pos.position.isRelevantToIndicators
        );

        let positionName = null;
        if (activePosition && activePosition.position) {
            const employeeGender = GenderMap[employee.gender?.toLowerCase()] || null;
            if (activePosition.position.gender && employeeGender) {
                positionName = activePosition.position.gender[employeeGender] || activePosition.position.name;
            } else {
                positionName = activePosition.position.name;
            }
        }

        return {
            name: {
                firstName: employee.name.firstName,
                lastName: employee.name.lastName,
                fullName: employee.name.fullName
            },
            grade: employee.grade[0].abbreviation,
            email: user.email,
            position: positionName,
            department: (activePosition && activePosition.position && activePosition.position.ascription)
                ? activePosition.position.ascription.name
                : null
        };
    }


}

export default UserController;

import express from 'express';
import morgan from 'morgan';
import userRoutes from './routers/user.router.js';
import indicatorDefinitionRoutes from './routers/indicatorDefinition.routes.js';
import indicatorDataRoutes from './routers/indicatorData.routes.js';
import reportRoutes from './routers/report.routes.js';
import reportPeriodRoutes from './routers/reportPeriod.routes.js';
import departmentRoutes from './routers/department.routes.js';
import statisticsRoutes from './routers/statistics.routes.js';
import container from './container.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
config({ path: './.env' });

const app = express();
app.use(express.json());

app.use(morgan('dev'));

const allowedOrigins = ['http://localhost:4200','https://gestor-indicadores-tec-tepic.vercel.app'];

app.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir credenciales (cookies, autenticación, etc.)
}));


// Middleware para inyectar el contenedor de awilix en cada request
app.use((req, res, next) => {
  req.container = container;
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Hola desde Express en Vercel 🚀" });
});

// Cargar rutas inyectando el contenedor
app.use("/users", userRoutes(container));
app.use("/indicators-definition", indicatorDefinitionRoutes(container));
app.use("/indicators-data", indicatorDataRoutes(container));
app.use("/reports", reportRoutes(container));
app.use("/report-periods", reportPeriodRoutes(container));
app.use("/departments", departmentRoutes(container));
app.use('/statistics', statisticsRoutes(container));

export default app;
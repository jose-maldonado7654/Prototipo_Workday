const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rutas
const employeesRouter = require('./routes/employees');
const leaveRouter = require('./routes/leave');
const reportsRouter = require('./routes/reports');
const recruitingRouter = require('./routes/recruiting');
const onboardingRouter = require('./routes/onboarding');
const compensationRouter = require('./routes/compensation');
const selfserviceRouter = require('./routes/selfservice');
const timeEntriesRouter = require('./routes/time-entries');
const expensesRouter = require('./routes/expenses');
const talentRouter = require('./routes/talent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 solicitudes por IP
});
app.use('/api', limiter);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== RUTAS DE LA API ====================

// Módulo 1: Gestión de Empleados
app.use('/api/employees', employeesRouter);

// Módulo 2: Reclutamiento
app.use('/api/recruiting', recruitingRouter);

// Módulo 3: Onboarding
app.use('/api/onboarding', onboardingRouter);

// Módulo 4: Seguimiento de Tiempo
app.use('/api/time', timeEntriesRouter);

// Módulo 5: Gestión de Ausencias
app.use('/api/leave', leaveRouter);

// Módulo 6: Gestión del Talento
app.use('/api/talent', talentRouter);

// Módulo 7: Compensaciones
app.use('/api/compensation', compensationRouter);

// Módulo 8: Gastos
app.use('/api/expenses', expensesRouter);

// Módulo 9: Autoservicio
app.use('/api/selfservice', selfserviceRouter);

// Módulo 10: Reportes y Analítica
app.use('/api/reports', reportsRouter);

// ==================== MANEJADORES DE ERRORES ====================

// Ruta 404 - No encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`✅ Módulos cargados:`);
  console.log(`   - Empleados (employees)`);
  console.log(`   - Reclutamiento (recruiting)`);
  console.log(`   - Onboarding (onboarding)`);
  console.log(`   - Tiempo (time)`);
  console.log(`   - Ausencias (leave)`);
  console.log(`   - Talento (talent)`);
  console.log(`   - Compensaciones (compensation)`);
  console.log(`   - Gastos (expenses)`);
  console.log(`   - Autoservicio (selfservice)`);
  console.log(`   - Reportes (reports)`);
});

module.exports = app;
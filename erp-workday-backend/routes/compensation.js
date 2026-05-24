// routes/compensation.js
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==================== COMPENSATION PLANS ====================

// GET /api/compensation/plans - Listar planes de compensación
router.get('/plans', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('compensation_plans')
      .select('*')
      .order('effective_date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/compensation/plans - Crear plan (admin)
router.post('/plans', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description, effective_date } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('compensation_plans')
      .insert([{ name, description, effective_date }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALARY HISTORY ====================

// GET /api/compensation/salary/:employeeId? - Historial salarial
router.get('/salary/:employeeId?', verifyToken, async (req, res) => {
  try {
    let employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      employeeId = employee?.id;
    }
    
    const { data, error } = await supabase
      .from('salary_history')
      .select('*, compensation_plan:compensation_plans(name)')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/compensation/salary - Registrar salario (admin)
router.post('/salary', verifyToken, isAdmin, async (req, res) => {
  try {
    const { employee_id, compensation_plan_id, amount, currency, effective_from } = req.body;
    
    // Cerrar el registro anterior
    await supabaseAdmin
      .from('salary_history')
      .update({ effective_to: new Date() })
      .eq('employee_id', employee_id)
      .is('effective_to', null);
    
    const { data, error } = await supabaseAdmin
      .from('salary_history')
      .insert([{ employee_id, compensation_plan_id, amount, currency, effective_from }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BONUS PAYMENTS ====================

// GET /api/compensation/bonus/:employeeId? - Listar bonos
router.get('/bonus/:employeeId?', verifyToken, async (req, res) => {
  try {
    let employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      employeeId = employee?.id;
    }
    
    const { data, error } = await supabase
      .from('bonus_payments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/compensation/bonus - Registrar bono (admin)
router.post('/bonus', verifyToken, isAdmin, async (req, res) => {
  try {
    const { employee_id, amount, bonus_type, payment_date, notes } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('bonus_payments')
      .insert([{ employee_id, amount, bonus_type, payment_date, notes }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ESTADÍSTICAS ====================

// GET /api/compensation/stats - Estadísticas de compensación
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data: avgSalaryByDept } = await supabase
      .from('salary_history')
      .select(`
        amount,
        employee:employees(
          department:departments(name)
        )
      `)
      .is('effective_to', null);
    
    const { data: bonusByYear } = await supabase
      .from('bonus_payments')
      .select('amount, payment_date')
      .order('payment_date', { ascending: false });
    
    res.json({
      avgSalaryByDept,
      bonusByYear
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
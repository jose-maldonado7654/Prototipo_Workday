// routes/selfservice.js
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken } = require('../middleware/auth');

// GET /api/selfservice/profile - Perfil del empleado
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*, department:departments(name), position:positions(title)')
      .eq('user_id', req.user.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/selfservice/profile - Actualizar perfil
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { phone, address, birth_date } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update({ phone, address, birth_date, updated_at: new Date() })
      .eq('user_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/selfservice/documents - Documentos del empleado
router.get('/documents', verifyToken, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employee.id);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/selfservice/summary - Resumen del empleado
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const [leaveBalance, pendingRequests, upcomingTasks] = await Promise.all([
      supabase
        .from('leave_balances')
        .select('*, policy:leave_policies(name)')
        .eq('employee_id', employee.id)
        .eq('year', new Date().getFullYear()),
      supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('status', 'pending'),
      supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5)
    ]);
    
    res.json({
      leaveBalance: leaveBalance.data || [],
      pendingRequests: pendingRequests.data || [],
      upcomingTasks: upcomingTasks.data || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
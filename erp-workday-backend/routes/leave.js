const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken } = require('../middleware/auth');

// GET /api/leave/requests - Mis solicitudes de ausencia
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        policy:leave_policies(name, days_per_year)
      `)
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leave/pending - Solicitudes pendientes (para managers)
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const { data: manager } = await supabase
      .from('employees')
      .select('id, department_id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(first_name, last_name, email),
        policy:leave_policies(name)
      `)
      .eq('status', 'pending')
      .eq('employee.department_id', manager.department_id);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leave/requests - Crear solicitud de ausencia
router.post('/requests', verifyToken, async (req, res) => {
  try {
    const { policy_id, start_date, end_date, reason } = req.body;
    
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert([{
        employee_id: employee.id,
        policy_id,
        start_date,
        end_date,
        reason,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/leave/requests/:id/approve - Aprobar solicitud
router.put('/requests/:id/approve', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const { data: manager } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: manager.id,
        approved_at: new Date(),
        comments
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/leave/requests/:id/reject - Rechazar solicitud
router.put('/requests/:id/reject', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    
    const { data: manager } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status: 'rejected',
        approved_by: manager.id,
        approved_at: new Date(),
        comments
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leave/balances - Mi saldo de días
router.get('/balances', verifyToken, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        policy:leave_policies(name, days_per_year)
      `)
      .eq('employee_id', employee.id)
      .eq('year', new Date().getFullYear());
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
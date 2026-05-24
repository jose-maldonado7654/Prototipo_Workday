// routes/onboarding.js
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==================== ONBOARDING TASKS ====================

// GET /api/onboarding/tasks - Tareas de onboarding
router.get('/tasks', verifyToken, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('employee_id', employee?.id)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/onboarding/tasks/all - Todas las tareas (admin)
router.get('/tasks/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select('*, employee:employees(first_name, last_name, email)')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/onboarding/tasks - Crear tarea
router.post('/tasks', verifyToken, isAdmin, async (req, res) => {
  try {
    const { employee_id, task_name, assigned_to, due_date } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('onboarding_tasks')
      .insert([{ employee_id, task_name, assigned_to, due_date }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/onboarding/tasks/:id/complete - Marcar tarea completada
router.put('/tasks/:id/complete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('onboarding_tasks')
      .update({ completed: true, completed_date: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMPLOYEE DOCUMENTS ====================

// GET /api/onboarding/documents - Documentos del empleado
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
      .eq('employee_id', employee?.id);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/onboarding/documents - Subir documento
router.post('/documents', verifyToken, async (req, res) => {
  try {
    const { document_type, document_url } = req.body;
    
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('employee_documents')
      .insert([{ employee_id: employee.id, document_type, document_url }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
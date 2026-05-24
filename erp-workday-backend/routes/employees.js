const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/employees - Listar todos los empleados (solo admin)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name),
        position:positions(title),
        manager:employees(first_name, last_name)
      `);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/me - Perfil del empleado autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name),
        position:positions(title)
      `)
      .eq('user_id', req.user.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/:id - Obtener empleado por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name),
        position:positions(title),
        manager:employees(first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees - Crear nuevo empleado (solo admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, department_id, position_id, manager_id, hire_date, birth_date, address } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert([{
        first_name,
        last_name,
        email,
        phone,
        department_id,
        position_id,
        manager_id,
        hire_date,
        birth_date,
        address,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/employees/:id - Actualizar empleado
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/employees/:id - Desactivar empleado (soft delete)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('employees')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json({ message: 'Employee deactivated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
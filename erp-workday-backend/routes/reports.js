const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/reports/headcount - Reporte de headcount por departamento
router.get('/headcount', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('headcount_by_department')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/hiring - Reporte de contrataciones
router.get('/hiring', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hiring_analysis')
      .select('*')
      .limit(12);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/leave-summary - Reporte de ausencias
router.get('/leave-summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_summary_by_department')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/expenses - Reporte de gastos
router.get('/expenses', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses_by_department')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
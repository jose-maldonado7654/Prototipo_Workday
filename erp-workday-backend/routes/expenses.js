const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expense_reports')
      .select('*')
      .order('report_date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
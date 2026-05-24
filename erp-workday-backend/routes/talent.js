const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');
const { verifyToken } = require('../middleware/auth');

router.get('/goals', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
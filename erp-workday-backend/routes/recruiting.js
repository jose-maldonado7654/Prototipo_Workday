// routes/recruiting.js
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabase');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ==================== JOB POSTINGS ====================

// GET /api/recruiting/jobs - Listar todas las ofertas
router.get('/jobs', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, department:departments(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recruiting/jobs/:id - Oferta específica
router.get('/jobs/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, department:departments(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recruiting/jobs/:id/candidates - Candidatos de una oferta
router.get('/jobs/:id/candidates', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidates(*)
      `)
      .eq('job_posting_id', id);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recruiting/jobs - Crear oferta (solo admin)
router.post('/jobs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, department_id, description, requirements, status } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'El título es requerido' });
    }
    if (!department_id) {
      return res.status(400).json({ error: 'El departamento es requerido' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .insert([{
        title: title.trim(),
        department_id,
        description: description || '',
        requirements: requirements || '',
        status: status || 'open',
        posted_date: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/recruiting/jobs/:id - Actualizar oferta
router.put('/jobs/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: existing, error: findError } = await supabase
      .from('job_postings')
      .select('id')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }
    
    const updates = req.body;
    const { data, error } = await supabaseAdmin
      .from('job_postings')
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

// DELETE /api/recruiting/jobs/:id - Eliminar oferta
router.delete('/jobs/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: existing, error: findError } = await supabase
      .from('job_postings')
      .select('id')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }
    
    const { error } = await supabaseAdmin
      .from('job_postings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Job posting deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CANDIDATES ====================

// GET /api/recruiting/candidates - Listar candidatos
router.get('/candidates', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recruiting/candidates/:id - Candidato específico
router.get('/candidates/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('candidates')
      .select('*, applications:applications(*, job_posting:job_postings(*))')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Candidato no encontrado' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recruiting/candidates - Crear candidato
router.post('/candidates', verifyToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, resume_url, source } = req.body;
    
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Nombre, apellido y email son requeridos' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('candidates')
      .insert([{
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        resume_url: resume_url || null,
        source: source || null,
        status: 'applied'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/recruiting/candidates/:id/status - Actualizar estado
router.put('/candidates/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['applied', 'screening', 'interview', 'offered', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPLICATIONS ====================

// POST /api/recruiting/applications - Aplicar a oferta
router.post('/applications', verifyToken, async (req, res) => {
  try {
    const { candidate_id, job_posting_id } = req.body;
    
    // Verificar que no exista una aplicación duplicada
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', candidate_id)
      .eq('job_posting_id', job_posting_id)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'El candidato ya aplicó a esta oferta' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert([{
        candidate_id,
        job_posting_id,
        applied_date: new Date(),
        status: 'applied'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INTERVIEWS ====================

// POST /api/recruiting/interviews - Programar entrevista
router.post('/interviews', verifyToken, isAdmin, async (req, res) => {
  try {
    const { application_id, interviewer_id, scheduled_date } = req.body;
    
    if (!application_id || !scheduled_date) {
      return res.status(400).json({ error: 'Application ID y fecha son requeridos' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .insert([{
        application_id,
        interviewer_id: interviewer_id || null,
        scheduled_date
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/recruiting/interviews/:id/feedback - Agregar feedback
router.put('/interviews/:id/feedback', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating debe ser entre 1 y 5' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('interviews')
      .update({ feedback: feedback || null, rating: rating || null })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
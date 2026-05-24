const { supabase } = require('../supabase');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware para verificar si es admin
const isAdmin = async (req, res, next) => {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('role')
      .eq('user_id', req.user.id)
      .single();
    
    if (error || employee?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
};

module.exports = { verifyToken, isAdmin };
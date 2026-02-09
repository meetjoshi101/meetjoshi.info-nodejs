const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/apiError');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }

  req.user = user;
  next();
}

module.exports = requireAuth;

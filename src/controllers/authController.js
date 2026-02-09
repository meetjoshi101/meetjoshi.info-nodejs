const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/apiError');
const { validateRequired } = require('../utils/validate');

async function login(req, res, next) {
  try {
    validateRequired(req.body, ['email', 'password']);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: req.body.email,
      password: req.body.password,
    });

    if (error) {
      throw new ApiError(401, 'Invalid credentials');
    }

    res.json({
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };

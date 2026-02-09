const { supabasePublic } = require('../config/supabase');
const ApiError = require('../utils/apiError');
const { validateRequired, validateEmail } = require('../utils/validate');

async function submitInquiry(req, res, next) {
  try {
    validateRequired(req.body, ['name', 'email', 'message']);
    validateEmail(req.body.email);

    const { error } = await supabasePublic
      .from('inquiries')
      .insert({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
      });

    if (error) throw new ApiError(500, error.message);
    res.json({ message: 'Inquiry sent successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitInquiry };

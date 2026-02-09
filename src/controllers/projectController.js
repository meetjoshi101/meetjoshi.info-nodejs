const { supabasePublic, supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/apiError');
const { camelToSnake } = require('../utils/caseUtils');
const { validateRequired } = require('../utils/validate');

async function getProjects(req, res, next) {
  try {
    let query = supabasePublic
      .from('projects')
      .select('id, title, category, image, description, featured');

    if (req.query.featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const { data, error } = await supabasePublic
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) throw new ApiError(404, 'Project not found');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    validateRequired(req.body, ['title', 'category', 'image', 'description']);

    const insertData = camelToSnake(req.body);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const updateData = camelToSnake(req.body);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw new ApiError(404, 'Project not found');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) throw new ApiError(404, 'Project not found');
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };

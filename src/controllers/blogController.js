const { supabasePublic, supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/apiError');
const { camelToSnake } = require('../utils/caseUtils');
const { validateRequired } = require('../utils/validate');

async function getBlogs(req, res, next) {
  try {
    const { data, error } = await supabasePublic
      .from('blogs')
      .select('id, title, excerpt, published_date, category, read_time, image')
      .order('published_date', { ascending: false });

    if (error) throw new ApiError(500, error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getBlogById(req, res, next) {
  try {
    const { data, error } = await supabasePublic
      .from('blogs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) throw new ApiError(404, 'Blog post not found');
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createBlog(req, res, next) {
  try {
    validateRequired(req.body, ['title', 'excerpt', 'category']);

    const insertData = camelToSnake(req.body);

    const { data, error } = await supabaseAdmin
      .from('blogs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) throw new ApiError(404, 'Blog post not found');
    res.json({ message: 'Blog post deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBlogs, getBlogById, createBlog, deleteBlog };

const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const {
  getBlogs,
  getBlogById,
  createBlog,
  deleteBlog,
} = require('../controllers/blogController');

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.post('/', requireAuth, createBlog);
router.delete('/:id', requireAuth, deleteBlog);

module.exports = router;

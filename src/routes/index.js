const router = require('express').Router();
const projectRoutes = require('./projectRoutes');
const blogRoutes = require('./blogRoutes');
const contactRoutes = require('./contactRoutes');
const authRoutes = require('./authRoutes');

router.use('/projects', projectRoutes);
router.use('/blogs', blogRoutes);
router.use('/contact', contactRoutes);
router.use('/auth', authRoutes);

module.exports = router;

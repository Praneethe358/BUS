const express = require('express');

const { getMe, listStudents } = require('../controllers/userController');
const { auth, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', auth, getMe);
router.get('/students', auth, authorizeRoles('admin'), listStudents);

module.exports = router;

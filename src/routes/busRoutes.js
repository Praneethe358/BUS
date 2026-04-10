const express = require('express');
const { body } = require('express-validator');

const {
  listBuses,
  createBus,
  assignStudentToBus,
  getLatestBusLocation,
  updateLatestBusLocation,
} = require('../controllers/busController');
const { auth, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

// Public latest-location endpoints for realtime UI bootstrap/fallback
router.get('/location/:busId', getLatestBusLocation);
router.post('/location', updateLatestBusLocation);
router.get('/list', auth, authorizeRoles('admin'), listBuses);

// Admin-only routes
router.post(
  '/create',
  auth,
  authorizeRoles('admin'),
  [
    body('busNumber').notEmpty().withMessage('busNumber is required'),
    body('routeName').notEmpty().withMessage('routeName is required'),
    body('stops').isArray().withMessage('stops must be an array'),
    body('stops.*.name').notEmpty().withMessage('Stop name is required'),
    body('stops.*.lat').isFloat().withMessage('Stop latitude must be a number'),
    body('stops.*.lng').isFloat().withMessage('Stop longitude must be a number'),
  ],
  validate,
  createBus
);

router.post(
  '/assign-student',
  auth,
  authorizeRoles('admin'),
  [
    body('studentId').isMongoId().withMessage('Valid studentId is required'),
    body('busId').isMongoId().withMessage('Valid busId is required'),
  ],
  validate,
  assignStudentToBus
);

module.exports = router;

var express = require('express');
var router = express.Router();
var StudyController = require('../controllers/StudyPlanController');
var authorization = require('../controllers/authorizationController');

// Plans
router.post('/plan/add', StudyController.addPlan);
router.get('/plan/user/:username', StudyController.getPlansForUser);
router.get('/plan/delete/:id', StudyController.deletePlan);

// Lessons
router.post('/plan/lesson/add', /*authorization.authenticate,*/ StudyController.addLesson);
router.get('/plan/:planId/lessons', StudyController.getLessonsForPlan);
router.post('/plan/lesson/update/:id', /*authorization.authenticate,*/ StudyController.updateLesson);
router.get('/plan/lesson/delete/:id', /*authorization.authenticate,*/ StudyController.deleteLesson);

module.exports = router;

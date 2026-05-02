// src/features/tasks/api/taskApi.js
import api from '../../../core/api/api';

/** GET /api/tasks/today → List<TaskDTO> */
export const getTodayTasks = () => api.get('/tasks/today');

/**
 * POST /api/tasks/submit-lead
 * Body: { taskType, email, mobile }
 * Returns: { partnerUrl }
 */
export const submitTaskLead = (taskType, email, mobile) =>
  api.post('/tasks/submit-lead', { taskType, email, mobile });

/**
 * POST /api/tasks/complete
 * Body: { taskType }
 */
export const completeTask = (taskType) =>
  api.post('/tasks/complete', { taskType });
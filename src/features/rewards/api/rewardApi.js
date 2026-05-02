// File: src/features/rewards/api/rewardApi.js
// ✅ FIXED: Was an empty file — all reward API calls added

import api from '../../../core/api/api';

/**
 * GET /api/rewards/balance
 * Returns: UserReward { totalCredits, redeemedCredits, pendingCredits }
 */
export const getBalance = () => api.get('/rewards/balance');

/**
 * GET /api/rewards/transactions?page=0&size=20
 * Returns: PageResponse<RewardTransaction> { content: [{credits, type, source, status, ...}] }
 */
export const getTransactions = (page = 0, size = 20) =>
  api.get(`/rewards/transactions?page=${page}&size=${size}`);

/**
 * GET /api/rewards/config
 * Returns: PublicRewardConfigDTO
 */
export const getRewardConfig = () => api.get('/rewards/config');

/**
 * POST /api/payouts/request
 * Body: { payoutType, payoutDetails, amount, idempotencyKey }
 */
export const requestPayout = (data) => api.post('/payouts/request', data);

/**
 * GET /api/payouts/my
 * Returns: PageResponse<PayoutDTO>
 */
export const getMyPayouts = (page = 0, size = 10) =>
  api.get(`/payouts/my?page=${page}&size=${size}`);
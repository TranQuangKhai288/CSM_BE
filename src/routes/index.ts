import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

/**
 * Main API Router
 *
 * All API routes are versioned for better backward compatibility
 * Current version: v1
 *
 * Future versions can be added here:
 * router.use('/v2', v2Routes);
 */

router.use('/v1', v1Routes);

export default router;

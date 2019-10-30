import express from 'express';

import { bindMethod } from '../..';

import { init as route$stats } from './stats';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /votes/{voteId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/stats', route$stats());

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}
import express from 'express';

import { bindMethod } from '../../../..';

import { init as route$ballot } from './ballot';

import method$get from './get';

/**
 * Sets up /codeholders/self/votes/{voteId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/ballot', route$ballot());

	bindMethod(router, '/', 'get', method$get);

	return router;
}
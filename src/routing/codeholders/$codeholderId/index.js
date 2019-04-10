import express from 'express';

import { bindMethod } from '../..';

import { init as route$address } from './address';

import method$get from './get';

/**
 * Sets up /codeholders/{codeholderId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	router.use('/address', route$address());

	bindMethod(router, '/', 'get', method$get);

	return router;
}

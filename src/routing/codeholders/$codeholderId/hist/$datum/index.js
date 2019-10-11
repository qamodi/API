import express from 'express';

import { bindMethod } from '../../../..';

import method$get from './get';

/**
 * Sets up /codeholders/{codeholderId}/hist/{datum}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);

	return router;
}
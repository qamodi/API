import express from 'express';

import { bindMethod } from '../../../../..';

import method$get from './get';
import method$post from './post';

/**
 * Sets up /congresses/{congressId}/instances/{instanceId}/locations
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });
	
	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'post', method$post);

	return router;
}

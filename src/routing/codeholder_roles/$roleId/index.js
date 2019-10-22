import express from 'express';

import { bindMethod } from '../..';

import method$get from './get';
import method$delete from './delete';
import method$patch from './patch';

/**
 * Sets up /codeholder_roles/{roleId}
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router({ mergeParams: true });

	bindMethod(router, '/', 'get', method$get);
	bindMethod(router, '/', 'delete', method$delete);
	bindMethod(router, '/', 'patch', method$patch);

	return router;
}

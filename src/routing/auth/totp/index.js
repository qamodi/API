import express from 'express';

import { bindMethod } from '../..';

import method$post from './post';

/**
 * Sets up /auth/totp
 * @return {express.Router}
 */
export function init () {
	const router = new express.Router();

	bindMethod(router, '/', 'post', method$post);

	return router;
}

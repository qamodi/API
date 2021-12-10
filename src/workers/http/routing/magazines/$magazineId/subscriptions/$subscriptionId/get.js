import QueryUtil from 'akso/lib/query-util';
import SimpleResource from 'akso/lib/resources/simple-resource';
import AKSOOrganization from 'akso/lib/enums/akso-organization';

import { schema as codeholderSchema, memberFilter } from 'akso/workers/http/routing/codeholders/schema';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'collection',
		body: null,
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const magazineOrgs = AKSOOrganization.allLower.filter(x => x !== 'akso')
			.filter(org => req.hasPermission('magazines.subscriptions.read.' + org));
		if (!magazineOrgs.length) {
			res.type('text/plain').status(400)
				.send('Missing perm magazines.subscriptions.read.<org>');
		}

		const query = AKSO.db('magazines_subscriptions')
			.where({
				'magazines_subscriptions.id': req.params.subscriptionId,
				'magazines_subscriptions.magazineId': req.params.magazineId
			})
			.whereExists(function () {
				this.select(1)
					.from('magazines')
					.whereRaw('magazines.id = magazines_subscriptions.magazineId')
					.whereIn('magazines.org', magazineOrgs);
			})
			.whereExists(function () {
				this.select(1)
					.from('view_codeholders')
					.whereRaw('view_codeholders.id = magazines_subscriptions.codeholderId');
				memberFilter(codeholderSchema, this, req);
			});
		QueryUtil.simpleResource(req, schema, query);
		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new SimpleResource(row);
		res.sendObj(obj);
	}
};

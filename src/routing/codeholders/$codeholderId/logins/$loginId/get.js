import QueryUtil from '../../../../../lib/query-util';
import CodeholderLoginResource from '../../../../../lib/resources/codeholder-login-resource';

import { schema as codeholderSchema, memberFilter, memberFieldsManual } from '../../../schema';
import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null,
		requirePerms: 'codeholders.read'
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		// Check member fields
		const requiredMemberFields = [
			'id',
			'logins'
		];
		if (!memberFieldsManual(requiredMemberFields, req, 'r')) {
			return res.status(403).type('text/plain').send('Missing permitted files codeholder fields, check /perms');
		}

		// Ensure that the we can access the codeholder through the member filter
		const codeholderQuery = AKSO.db('view_codeholders')
			.where('id', req.params.codeholderId)
			.first(1);
		memberFilter(codeholderSchema, codeholderQuery, req);
		if (!await codeholderQuery) { return res.sendStatus(404); }

		const query = AKSO.db('codeholders_logins')
			.where({
				id: req.params.loginId,
				codeholderId: req.params.codeholderId
			});
		QueryUtil.simpleResource(req, schema, query);

		const row = await query;
		try {
			const obj = new CodeholderLoginResource(row);
			res.sendObj(obj);
		} catch (e) {
			if (e.simpleResourceError) { return res.sendStatus(404); }
			throw e;
		}
	}
};

import QueryUtil from '../../../../../lib/query-util';
import CountryGroupResource from '../../../../../lib/resources/country-group-resource';

import parSchema from '../schema';

const schema = {
	...parSchema,
	...{
		query: 'resource',
		body: null
	}
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('countries_groups')
			.leftJoin('countries_groups_members', 'code', 'group_code')
			.groupBy('code');

		QueryUtil.simpleResource(req, schema, query);
		query.where('code', req.params.group);
		const row = await query;
		if (!row) { return res.sendStatus(404); }
		const obj = new CountryGroupResource(row);
		res.sendObj(obj);
	}
};

import QueryUtil from '../../lib/query-util';
import HttpLogResource from '../../lib/resources/http-log-resource';

const schema = {
	query: 'collection',
	defaultFields: [ 'id' ],
	fields: {
		id: 'f',
		time: 'f',
		codeholderId: 'f',
		apiKey: 'f',
		ip: 'f',
		origin: 'f',
		userAgent: 's',
		method: 'f',
		path: 'f',
		query: '',
		resStatus: 'f',
		resTime: 'f'
	},
	body: null,
	requirePerms: 'log.read'
};

export default {
	schema: schema,

	run: async function run (req, res) {
		const query = AKSO.db('httpLog');
		await QueryUtil.handleCollection(req, res, schema, query, HttpLogResource);
	}
};
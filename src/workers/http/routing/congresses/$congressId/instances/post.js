import path from 'path';

import latlonSchema from '../../../../lib/latlon-schema';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$'
				},
				humanId: {
					type: 'string',
					minLength: 1,
					maxLength: 20,
					pattern: '^[^\\n]+$'
				},
				dateFrom: {
					type: 'string',
					format: 'date'
				},
				dateTo: {
					type: 'string',
					format: 'date'
				},
				locationName: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				locationNameLocal: {
					type: 'string',
					minLength: 1,
					maxLength: 100,
					pattern: '^[^\\n]+$',
					nullable: true
				},
				locationCoords: {
					...latlonSchema,
					...{
						nullable: true
					}
				},
				locationAddress: {
					type: 'string',
					minLength: 1,
					maxLength: 500,
					nullable: true
				},
				tz: {
					type: 'string',
					format: 'tz',
					nullable: true
				}
			},
			required: [
				'name',
				'humanId',
				'dateFrom',
				'dateTo'
			],
			additionalProperties: false
		}
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const orgData = await AKSO.db('congresses')
			.where('id', req.params.congressId)
			.first('org');
		if (!orgData) { return res.sendStatus(404); }
		if (!req.hasPermission('congress_instances.read.' + orgData.org)) { return res.sendStatus(403); }

		const data = {
			...req.body,
			...{
				congressId: req.params.congressId
			}
		};
		if (data.locationCoords) {
			data.locationCoords = AKSO.db.raw('POINT(?, ?)', data.locationCoords);
		}

		const id = (await AKSO.db('congresses_instances').insert(data))[0];

		res.set('Location', path.join(AKSO.conf.http.path, 'congresses', req.params.congressId , 'instances', id.toString()));
		res.sendStatus(201);
	}
};

import { handleMemberRestrictions } from 'akso/workers/http/routing/admin_groups/schema';

export default {
	schema: {
		requirePerms: [
			'clients.read', 'clients.perms.update'
		]
	},

	run: async function run (req, res) {
		handleMemberRestrictions(req.body);

		const apiKey = Buffer.from(req.params.apiKey, 'hex');

		const deleted = await AKSO.db('admin_permissions_memberRestrictions_clients')
			.where('apiKey', apiKey)
			.delete();

		res.sendStatus(deleted ? 204 : 404);
	}
};

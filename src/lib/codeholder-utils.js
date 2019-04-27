/**
 * Obtains the names and emails of codeholders by their ids
 * @param  {...number} ids The internal ids of the codeholders to look up
 * @return {Object[]} The names and emails of the codeholders in the same order as they were provided
 */
export async function getNamesAndEmails (...ids) {
	const codeholders = await AKSO.db('view_codeholders')
		.whereIn('id', ids)
		.select('codeholderType', 'honorific', 'firstName', 'firstNameLegal', 'lastName', 'lastNameLegal', 'fullName', 'email');

	return codeholders.map(codeholder => {
		let name;
		if (codeholder.codeholderType === 'human') {
			if (codeholder.honorific) { name += codeholder.honorific + ' '; }
			name = codeholder.firstName || codeholder.firstNameLegal;
			name += ' ' + (codeholder.lastName || codeholder.lastNameLegal);

		} else if (codeholder.codeholderType === 'org') {
			name = codeholder.fullName;
		}
		return {
			email: codeholder.email,
			name: name
		};
	});
}

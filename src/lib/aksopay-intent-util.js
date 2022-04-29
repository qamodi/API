import { createTransaction, arrToObjByKey } from 'akso/util';
import { renderSendEmail } from 'akso/mail';

import { afterQuery as intentAfterQuery } from 'akso/workers/http/routing/aksopay/payment_intents/schema';
import { afterQuery as registrationEntryAfterQuery } from 'akso/workers/http/routing/registration/entries/schema';

import moment from 'moment-timezone';
import { base32 } from 'rfc4648';

/**
 * Updates the statuses of the PaymentIntents with the given IDs
 * @param  {string[]} ids          The ids of the PaymentIntents to update
 * @param  {string}   status       The new status
 * @param  {number}   [time]       The time of the change, defaults to the current time
 * @param  {Object}   [updateData] Additional update data
 */
export async function updateStatuses (ids, status, time = moment().unix(), updateData = {}) {
	if (!updateData.status) {
		updateData.status = status;
		updateData.statusTime = time;
	}

	if (status === 'succeeded') {
		updateData.succeededTime = time;
	} else if (status === 'refunded') {
		updateData.refundedTime = time;
	}

	const trx = await createTransaction();

	await Promise.all([
		trx('pay_intents')
			.whereIn('id', ids)
			.update(updateData),

		trx('pay_intents_events')
			.insert(ids.map(id => {
				return {
					paymentIntentId: id,
					time: time,
					status: status
				};
			}))
	]);

	await trx.commit();

	if (status === 'succeeded') {
		for (const id of ids) {
			try {
				await sendReceiptEmail(id);
			} catch (e) {
				if (!e.isAKSO) { throw e; }
			}
		}
	}
}

export function updateStatus (id, ...args) {
	return updateStatuses([id], ...args);
}

export async function sendReceiptEmail (id, email = undefined) {
	// Try to find the intent
	const intent = await AKSO.db('pay_intents')
		.first(
			'id', 'customer_email', 'customer_name', 'paymentMethod', 'currency',
			'org', 'succeededTime', 'intermediaryCountryCode', {
				purposes: 1,
			})
		.where({
			id,
			status: 'succeeded'
		});
	if (!intent) {
		const err = new Error('unknown intent');
		err.isAKSO = true;
		throw err;
	}
	if (!email) {
		email = intent.customer_email;
	}
	if (!email) {
		const err = new Error('no customer email, cannot send receipt');
		err.isAKSO = true;
		throw err;
	}

	// Obtain purposes etc.
	await new Promise(resolve => intentAfterQuery([intent], resolve));
	for (const purpose of intent.purposes) {
		if (purpose.type !== 'trigger') { continue; }
		if (purpose.triggers !== 'registration_entry') { continue; }
		purpose._registrationEntryIdHex = purpose.registrationEntryId.toString('hex');
	}

	const isDonation = intent.purposes
		.filter(purpose => {
			if (purpose.type === 'trigger') { return true; }
			return false;
		})
		.length === 0;

	const registrationEntryIds = intent.purposes
		.filter(purpose =>
			purpose.type === 'trigger'
			&& purpose.triggers === 'registration_entry')
		.map(purpose => purpose.registrationEntryId);
	const registrationEntryInfoRaw = await AKSO.db('registration_entries')
		.select('id', { offers: 1 })
		.whereIn('id', registrationEntryIds);
	await new Promise(resolve => registrationEntryAfterQuery(registrationEntryInfoRaw, resolve));
	
	const magazineIds = registrationEntryInfoRaw
		.flatMap(registrationEntry => registrationEntry.offers)
		.filter(offer => offer.type === 'magazine')
		.map(offer => offer.id);
	const magazines = arrToObjByKey(
		await AKSO.db('magazines')
			.select('id', 'name')
			.whereIn('id', magazineIds),
		'id'
	);

	const membershipCategoryIds = registrationEntryInfoRaw
		.flatMap(registrationEntry => registrationEntry.offers)
		.filter(offer => offer.type === 'membership')
		.map(offer => offer.id);
	const membershipCategories = arrToObjByKey(
		await AKSO.db('membershipCategories')
			.select('id', 'name', 'nameAbbrev')
			.whereIn('id', membershipCategoryIds),
		'id'
	);

	const registrationEntryInfo = {};
	for (const registrationEntry of registrationEntryInfoRaw) {
		const idHex = registrationEntry.id.toString('hex');
		registrationEntryInfo[idHex] = registrationEntry.offers
			.map(offer => {
				if (offer.type === 'membership') {
					const membershipCategory = membershipCategories[offer.id][0];
					return `${membershipCategory.name} (${membershipCategory.nameAbbrev})`;
				} else if (offer.type === 'magazine') {
					const magazine = magazines[offer.id][0];
					return `${offer.paperVersion ? 'Papera' : 'Reta'} revuo ${magazine.name}`;
				}
			})
			.map(str => ': ' + str)
			.join('\n');
	}

	await renderSendEmail({
		org: intent.org,
		tmpl: 'aksopay-receipt',
		personalizations: [{
			to: {
				email,
				name: intent.customer_name,
			},
		}],
		view: {
			intent,
			isDonation,
			idEncoded: base32.stringify(intent.id),
			registrationEntryInfo,
			totalAmount: intent.purposes
				.map(p => p.amount)
				.reduce((a, b) => a + b),
		},
	});
}

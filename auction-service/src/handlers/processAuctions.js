import createError from 'http-errors';
import { closeAuction } from '../lib/closeAuction';
import { getEndedAuctions } from '../lib/getEndedAuctions';

async function processAuctions(event, context) {
    try {
        const auctionsToClose = await getEndedAuctions();
        const closePromisses = auctionsToClose.map(auction => closeAuction(auction));
        await Promise.all(closePromisses);
        return { closed: closePromisses.length };
    } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
    }
}

export const handler = processAuctions;
import { getAuctionById } from './getAuction';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import validator from '@middy/validator';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema';

export async function uploadAuctionPicture(event) {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionById(id);

    if (auction.seller !== email) {
        throw new createError.Forbidden(`you are not the seller of this auction to upload picture`);
    }

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let updatedAuction;

    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer);
        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
    } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
    }
    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = middy(uploadAuctionPicture)
.use(httpErrorHandler())
.use(cors())
.use(validator({
     inputSchema: uploadAuctionPictureSchema,
     ajvOptions: {
        useDefaults: true,
        strict: false,
      },
    }
    ));
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;


export const uploadObject = async (key: string, object: any) => {
    const putObjectCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(object)
    });

    await s3Client.send(putObjectCommand);
}


/**
 * Generates a presigned URL for an S3 object
 * @param key The S3 object key
 * @param expiresIn The number of seconds until the presigned URL expires
 * @returns A promise that resolves to the presigned URL
 */
export async function generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
}
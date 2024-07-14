import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";


export const uploadObject = async (s3Client: S3Client, bucket: string, key: string, object: any) => {
    const putObjectCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(object)
    });

    await s3Client.send(putObjectCommand);
}
import { RemovalPolicy } from "aws-cdk-lib"
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"


interface CreateBucketS3Props {
    bucketName: string
}


export const createBucketS3 = (scope: Construct, props: CreateBucketS3Props) => {


    const { bucketName } = props

    const bucket = new Bucket(scope, bucketName, {
        bucketName,
        removalPolicy: RemovalPolicy.DESTROY,
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        autoDeleteObjects: true,
        cors: [
            {
                allowedMethods: [
                    HttpMethods.GET,
                    HttpMethods.PUT,
                    HttpMethods.POST,
                    HttpMethods.DELETE
                ],
                allowedOrigins: [
                    "*" // Allow all origins to access the bucket in a real-world scenario you should restrict this to only the domain of your website
                ],
                allowedHeaders: [
                    "*"
                ]
            }
        ],
    })

    return bucket

}
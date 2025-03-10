import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { IBucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import path = require("path")


interface LambdaGetNotesProps {
    functionName: string
    description: string
    notesTable: ITable
    bucket: IBucket
}



export const CreateLambdaGetNotes = (scope: Construct, props: LambdaGetNotesProps) => {

    const { functionName, description, notesTable, bucket } = props

    const lambda = new NodejsFunction(scope, 'LambdaGetNotes', {
        entry: path.join(__dirname, 'main.ts'),
        handler: 'handler',
        functionName,
        description,
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(30),
        environment: {
            TABLE_NAME: notesTable.tableName,
            BUCKET_NAME: bucket.bucketName
        }
    })

    notesTable.grantReadData(lambda)
    bucket.grantRead(lambda)

    return lambda
}
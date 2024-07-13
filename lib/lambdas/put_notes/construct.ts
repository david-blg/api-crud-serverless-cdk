import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { IBucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import path = require("path")


interface CreateLambdaPutNotesProps {
    functionName: string
    description: string
    notesTable: ITable
    bucket: IBucket
}



export const createLambdaPutNotes = (scope: Construct, props: CreateLambdaPutNotesProps) => {

    const { functionName, description, notesTable, bucket } = props

    const lambda = new NodejsFunction(scope, 'LambdaPutNotes', {
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

    notesTable.grantReadWriteData(lambda)
    bucket.grantReadWrite(lambda)

    return lambda
}
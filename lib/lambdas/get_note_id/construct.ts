import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { IKey } from "aws-cdk-lib/aws-kms"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Queue } from "aws-cdk-lib/aws-sqs"
import { Construct } from "constructs"
import path = require("path")


interface LambdaGetNoteIdProps {
    functionName: string
    description: string
    notesTable: ITable
    kmsKey: IKey
    dlq: Queue
}

export const createLambdaGetNoteId = (scope: Construct, props: LambdaGetNoteIdProps) => {

    const { functionName, description, notesTable, kmsKey, dlq} = props

    const lambda = new NodejsFunction(scope, 'LambdaGetNoteId', {
        entry: path.join(__dirname, 'main.ts'),
        handler: 'handler',
        functionName,
        description,
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(30),
        environment: {
            TABLE_NAME: notesTable.tableName
        },
        reservedConcurrentExecutions: 10,
        environmentEncryption: kmsKey,
        deadLetterQueueEnabled: true,
        deadLetterQueue: dlq
    })

    notesTable.grantReadData(lambda)

    return lambda
}
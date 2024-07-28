import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { IKey } from "aws-cdk-lib/aws-kms"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Queue } from "aws-cdk-lib/aws-sqs"
import { Construct } from "constructs"
import path = require("path")

interface CreateLambdaDeleteNotesProps {
    functionName: string
    description: string
    notesTable: ITable
    kmsKey: IKey
    dlq: Queue
}

export const createLamdaDeleteNotes = (scope: Construct, props: CreateLambdaDeleteNotesProps) => {
    const { functionName, description, notesTable, kmsKey, dlq } = props

    const lambda = new NodejsFunction(scope, 'LambdaDeleteNotes', {
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
        reservedConcurrentExecutions: 100,
        environmentEncryption: kmsKey,
        deadLetterQueueEnabled: true,
        deadLetterQueue: dlq

    })

    notesTable.grantReadWriteData(lambda)

    return lambda
}
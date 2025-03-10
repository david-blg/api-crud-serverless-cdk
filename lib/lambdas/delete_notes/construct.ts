import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"
import path = require("path")

interface CreateLambdaDeleteNotesProps {
    functionName: string
    description: string
    notesTable: ITable
}

export const createLamdaDeleteNotes = (scope: Construct, props: CreateLambdaDeleteNotesProps) => {
    const { functionName, description, notesTable } = props

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
        }
    })

    notesTable.grantReadWriteData(lambda)

    return lambda
}
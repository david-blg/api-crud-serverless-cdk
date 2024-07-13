import { Duration } from "aws-cdk-lib"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"
import path = require("path")


interface LambdaGetNoteIdProps {
    functionName: string
    description: string
    notesTable: ITable
}

export const createLambdaGetNoteId = (scope: Construct, props: LambdaGetNoteIdProps) => {

    const { functionName, description, notesTable } = props

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
        }
    })

    notesTable.grantReadData(lambda)

    return lambda
}
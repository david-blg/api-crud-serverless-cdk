import { Duration } from "aws-cdk-lib"
import { ITableV2 } from "aws-cdk-lib/aws-dynamodb"
import { Role } from "aws-cdk-lib/aws-iam"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"
import path = require("path")


interface LambdaGetNotesProps {
    functionName: string
    description: string
    notesTable: ITableV2
}



export const CreateLambdaGetNotes = (scope: Construct, props: LambdaGetNotesProps) => {

    const { functionName, description, notesTable } = props

    const lambda = new NodejsFunction(scope, 'LambdaGetNotes', {
        entry: path.join(__dirname, 'main.ts'),
        handler: 'handler',
        functionName,
        description,
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(30),
        environment:{
            TABLE_NAME: notesTable.tableName
        }
    })

    const role = new Role(scope, 'LambdaGetNotesRole', {
        assumedBy: lambda.grantPrincipal,
        roleName: 'LambdaGetNotesRole'
    })

    notesTable.grantReadData(role)

    return lambda
}
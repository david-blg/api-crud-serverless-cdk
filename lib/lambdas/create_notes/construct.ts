import { Duration } from "aws-cdk-lib"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"
import path = require("path")


interface CreateLambdaGetNotesProps {
    functionName: string
    description: string
}



export const createLambdaGetNotes = (scope: Construct, props: CreateLambdaGetNotesProps) => {

    const { functionName, description } = props

    const lambda = new NodejsFunction(scope, 'LambdaGetNotes', {
        entry: path.join(__dirname, 'main.ts'),
        handler: 'handler',
        functionName,
        description,
        runtime: Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: Duration.seconds(30)

    })

    return lambda
}
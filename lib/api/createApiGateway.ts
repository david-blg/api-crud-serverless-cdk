import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";



interface CreateApiGatewayProps {
    restApiName: string
    description: string
    lamdaGetNotes: IFunction
}

export const createApiGateway = (scope: Construct, props: CreateApiGatewayProps) => {

    const { restApiName, description, lamdaGetNotes } = props

    const api = new RestApi(scope, restApiName, {
        restApiName,
        description
    })

    // Create a resource under the root resource of the API Endpoint, Example: /v1
    const rootResource = api.root.addResource('v1')


    
    // Create a resource under the /v1 resource, Example: /v1/notes with a GET, POST, PUT, DELETE method available
    const notesResource = rootResource.addResource('notes')

    // Create lambda integration for the GET method
    notesResource.addMethod('GET', new LambdaIntegration(lamdaGetNotes),{
        operationName: 'GetNotes from DynamoDB'
    })

}
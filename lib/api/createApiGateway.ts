import { LambdaIntegration, RestApi, CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { addCorsOptions } from "./cors";

interface CreateApiGatewayProps {
    restApiName: string;
    description: string;
    lamdaGetNotes: IFunction;
    cognitoPool: IUserPool;
}

export const createApiGateway = (scope: Construct, props: CreateApiGatewayProps) => {
    const { restApiName, description, lamdaGetNotes, cognitoPool } = props;

    const api = new RestApi(scope, restApiName, {
        restApiName,
        description
    });


    // Crear un recurso bajo el recurso raíz del API Endpoint, Ejemplo: /v1
    const rootResource = api.root.addResource('v1');

    // Crear un recurso bajo el recurso /v1, Ejemplo: /v1/notes con métodos GET, POST, PUT, DELETE disponibles
    const notesResource = rootResource.addResource('notes');


    // Crear el authorizer de Cognito para API Gateway
    const authorizer = new CognitoUserPoolsAuthorizer(scope, 'CognitoAuthorizer', {
        cognitoUserPools: [cognitoPool],
        authorizerName: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization'
    });


    // Crear integración lambda para el método GET del recurso /v1/notes
    notesResource.addMethod('GET', new LambdaIntegration(lamdaGetNotes), {
        operationName: 'GetNotes from DynamoDB',
        authorizer,
    });

    // Añadir CORS a /v1/notes
    addCorsOptions(notesResource, ['GET']);
}
import { LambdaIntegration, RestApi, CognitoUserPoolsAuthorizer, RequestValidator, JsonSchemaType } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { addCorsOptions } from "./cors";
import { createValidators, BODY_VALIDATOR, PARAM_VALIDATOR } from "./validators";

interface CreateApiGatewayProps {
    restApiName: string;
    description: string;
    cognitoPool: IUserPool;
    lambdaGetNotes: IFunction;
    lambdaPutNotes: IFunction;
    lambdaGetNoteId: IFunction;
    lambdaDeleteNotes: IFunction;
}

export const createApiGateway = (scope: Construct, props: CreateApiGatewayProps) => {
    const {
        restApiName,
        description,
        cognitoPool,
        lambdaGetNotes,
        lambdaPutNotes,
        lambdaGetNoteId,
        lambdaDeleteNotes
    } = props;

    const api = new RestApi(scope, restApiName, {
        restApiName,
        description
    });

    // Crear validadores
    const bodyValidator = createValidators(scope, api, BODY_VALIDATOR); // POST, PUT
    const paramValidator = createValidators(scope, api, PARAM_VALIDATOR); // GET, DELETE

    const rootResource = api.root.addResource('v1');
    const notesResource = rootResource.addResource('notes');

    const authorizer = new CognitoUserPoolsAuthorizer(scope, 'CognitoAuthorizer', {
        cognitoUserPools: [cognitoPool],
        authorizerName: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization'
    });

    notesResource.addMethod('GET', new LambdaIntegration(lambdaGetNotes), {
        operationName: 'GetAllNotes',
        authorizer,
        requestValidator: paramValidator,
        requestParameters: {
            'method.request.querystring.limit': false,
            'method.request.querystring.nextToken': false
        }
    });

    notesResource.addMethod('POST', new LambdaIntegration(lambdaPutNotes), {
        operationName: 'CreateNote',
        authorizer,
        requestValidator: bodyValidator,
        requestModels: {
            'application/json': api.addModel('CreateNoteModel', {
                contentType: 'application/json',
                modelName: 'CreateNoteModel',
                schema: {
                    type: JsonSchemaType.OBJECT,
                    required: ['title', 'content'],
                    properties: {
                        title: { type: JsonSchemaType.STRING },
                        content: { type: JsonSchemaType.STRING },
                    }
                }
            })
        }
    });

    const noteIdResource = notesResource.addResource('{noteId+}');

    noteIdResource.addMethod('GET', new LambdaIntegration(lambdaGetNoteId), {
        operationName: 'GetNoteById',
        authorizer,
        requestValidator: paramValidator,
        requestParameters: {
            'method.request.path.noteId': true
        }
    });

    noteIdResource.addMethod('PUT', new LambdaIntegration(lambdaPutNotes), {
        operationName: 'UpdateNote',
        authorizer,
        requestValidator: bodyValidator,
        requestParameters: {
            'method.request.path.noteId': true
        },
        requestModels: {
            'application/json': api.addModel('UpdateNoteModel', {
                contentType: 'application/json',
                modelName: 'UpdateNoteModel',
                schema: {
                    type: JsonSchemaType.OBJECT,
                    properties: {
                        title: { type: JsonSchemaType.STRING },
                        content: { type: JsonSchemaType.STRING },
                    }
                }
            })
        }
    });

    noteIdResource.addMethod('DELETE', new LambdaIntegration(lambdaDeleteNotes), {
        operationName: 'DeleteNote',
        authorizer,
        requestValidator: paramValidator,
        requestParameters: {
            'method.request.path.noteId': true
        }
    });

    // Añadir CORS
    addCorsOptions(notesResource, ['GET', 'POST', 'OPTIONS']);
    addCorsOptions(noteIdResource, ['GET', 'PUT', 'DELETE', 'OPTIONS']);

    return api;
};
import {
    LambdaIntegration, RestApi, CognitoUserPoolsAuthorizer,
    JsonSchemaType, StageOptions, LogGroupLogDestination,
    AccessLogFormat, Deployment, Stage
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { addCorsOptions } from "./cors";
import { createValidators, BODY_VALIDATOR, PARAM_VALIDATOR } from "./validators";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { IKey } from "aws-cdk-lib/aws-kms";

interface CreateApiGatewayProps {
    restApiName: string;
    description: string;
    cognitoPool: IUserPool;
    lambdaGetNotes: IFunction;
    lambdaPutNotes: IFunction;
    lambdaGetNoteId: IFunction;
    lambdaDeleteNotes: IFunction;
    kmsKey: IKey;
}

export const createApiGateway = (scope: Construct, props: CreateApiGatewayProps) => {
    const {
        restApiName,
        description,
        cognitoPool,
        lambdaGetNotes,
        lambdaPutNotes,
        lambdaGetNoteId,
        lambdaDeleteNotes,
        kmsKey
    } = props;

    // Create Group CloudWatch Logs
    const logGroup = new LogGroup(scope, 'ApiGatewayLogGroup', {
        logGroupName: `/aws/api-gateway/${restApiName}`,
        retention: RetentionDays.ONE_WEEK,
        encryptionKey: kmsKey.addAlias('ApiGatewayLogGroupKey')
    });


    // Create Stage Options with cache enabled, access log and tracing
    const stageOptions: StageOptions = {
        stageName: 'prod',
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields({
            caller: true,
            httpMethod: true,
            ip: true,
            protocol: true,
            requestTime: true,
            resourcePath: true,
            responseLength: true,
            status: true,
            user: true,
        }),
        tracingEnabled: true
    };

    const api = new RestApi(scope, restApiName, {
        restApiName,
        description,
        deployOptions: stageOptions,
    });

    // Create deployment and stage
    const deployment = new Deployment(scope, 'ApiDeployment', { api });
    const stage = new Stage(scope, 'ApiStage', {
        deployment,
        ...stageOptions,
    });

    api.deploymentStage = stage;

    // Create Request Validator
    const bodyValidator = createValidators(scope, api, BODY_VALIDATOR); // POST, PUT
    const paramValidator = createValidators(scope, api, PARAM_VALIDATOR); // GET, DELETE

    const rootResource = api.root.addResource('v1');
    const notesResource = rootResource.addResource('notes');

    // Create Cognito Authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(scope, 'CognitoAuthorizer', {
        cognitoUserPools: [cognitoPool],
        authorizerName: 'CognitoAuthorizer',
        identitySource: 'method.request.header.Authorization'
    });

    // Create API Gateway Methods for CRUD Operations (GET, POST, PUT, DELETE)
    notesResource.addMethod('GET', new LambdaIntegration(lambdaGetNotes), {
        operationName: 'GetAllNotes',
        authorizer,
        requestValidator: paramValidator,
        requestParameters: {
            'method.request.querystring.limit': false,
            'method.request.querystring.nextToken': false,
            'method.request.path.userId': true
        },
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

    // Endpoint for Get, Update and Delete Note by ID
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

    // Add CORS
    addCorsOptions(notesResource, ['GET', 'POST', 'OPTIONS']);
    addCorsOptions(noteIdResource, ['GET', 'PUT', 'DELETE', 'OPTIONS']);

    return api;
};
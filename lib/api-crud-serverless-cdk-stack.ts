import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createApiGateway } from './api/createApiGateway';
import { createLambdaGetNotes } from './lambdas/create_notes/construct';
import { createCognitoIAM } from './auth/createCognitoIAM';


export class ApiCrudServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    // Create Cognito Pool 
    const cognitoPool = createCognitoIAM(this, {
      userPoolName: 'Cognito-User-Pool',
      domainPrefix: 'api-crud-serverless-demo'
    })

    // Create a Lambda function
    const lamdaGetNotes = createLambdaGetNotes(this, {
      functionName: 'Lambda-Get-Notes',
      description: 'This Lambda function will return all notes'
    })

    // Create a Rest API
    const apiGateway = createApiGateway(this, {
      restApiName: 'Api-Crud-Serverless-Demo',
      description: 'This is a simple API Gateway for a CRUD serverless application using AWS CDK',
      lamdaGetNotes,
      cognitoPool
    })
  }
}

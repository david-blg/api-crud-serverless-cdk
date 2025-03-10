import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createApiGateway } from './api/createApiGateway';
import { createCognitoIAM } from './auth/createCognitoIAM';
import { CreateLambdaGetNotes } from './lambdas/get_notes/construct';
import { createNotesTable } from './dynamo_db/createDynamoDb';
import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { createLambdaPutNotes } from './lambdas/put_notes/construct';
import { createLamdaDeleteNotes } from './lambdas/delete_notes/construct';
import { createLambdaGetNoteId } from './lambdas/get_note_id/construct';
import { createBucketS3 } from './s3/createBucketS3';


export class ApiCrudServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    // Create Cognito Pool 
    const cognitoPool = createCognitoIAM(this, {
      userPoolName: 'Cognito-User-Pool',
      domainPrefix: 'api-crud-serverless-demo'
    })


    // Create a DynamoDB Table
    const notesTable = createNotesTable(this, {
      tableName: 'UserNotes',
      enableStreams: false, // Enable DynamoDB Streams if you want to use it
      enablePointInTimeRecovery: false, // Enable Point in Time Recovery for the DynamoDB Table (backup)
      billingMode: BillingMode.PAY_PER_REQUEST
    })

    // Create Bucket S3 for file uploads
    const bucket = createBucketS3(this, {
      bucketName: 'bucket-s3-api-crud-serverless-demo'
    })

    // Create a Lambda functions
    const lambdaGetNotes = CreateLambdaGetNotes(this, {
      functionName: 'Lambda-Get-Notes',
      description: 'This Lambda function will return all notes',
      notesTable,
      bucket
    })

    const lambdaGetNoteId = createLambdaGetNoteId(this, {
      functionName: 'Lambda-Get-Note-Id',
      description: 'This Lambda function will return a note by its ID',
      notesTable
    })

    const lambdaPutNotes = createLambdaPutNotes(this, {
      functionName: 'Lambda-Put-Notes',
      description: 'This Lambda function will create a new note or update an existing one',
      notesTable,
      bucket
    })

    const lambdaDeleteNotes = createLamdaDeleteNotes(this, {
      functionName: 'Lambda-Delete-Notes',
      description: 'This Lambda function will delete a note',
      notesTable
    })

    // Create a Rest API
    const apiGateway = createApiGateway(this, {
      restApiName: 'Api-Crud-Serverless-Demo',
      description: 'This is a simple API Gateway for a CRUD serverless application using AWS CDK',
      cognitoPool,
      lambdaGetNotes,
      lambdaPutNotes,
      lambdaDeleteNotes,
      lambdaGetNoteId
    })
  }
}

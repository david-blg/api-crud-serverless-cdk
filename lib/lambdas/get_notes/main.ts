// Lambda function to get all notes from DynamoDB for a specific user

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ResponseError } from "../utils/responses";


interface Note {
    noteId: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
// const s3Client = new S3Client({});



// Get resource names from environment variables
const TABLE_NAME = process.env.TABLE_NAME!;
// const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler = async (event: any = {}): Promise<any> => {
    console.log('Event:', event);

    try {
        // Extract userId from path parameters or query string parameters
        const userId = event.pathParameters?.userId || event.queryStringParameters?.userId;

        if (!userId) {
            return ResponseError(400, 'UserId is required');
        }

        // Query DynamoDB for all notes belonging to the user
        const queryCommand = new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        });

        const { Items } = await docClient.send(queryCommand);

        if (!Items || Items.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No notes found for this user',
                    notes: []
                })
            };
        }

        const notes: Note[] = Items.map((item) => ({
            noteId: item.noteId,
            title: item.title,
            content: item.content,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Notes retrieved successfully',
                notes: notes
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return ResponseError(500, 'Internal Server Error');
    }
}
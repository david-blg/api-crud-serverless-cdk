import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ResponseError } from "../utils/responses";
import { generatePresignedUrl } from "../utils/s3_utils";

interface Note {
    noteId: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
    s3Key?: string;
    presignedUrl?: string;
}

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Get resource names from environment variables
const TABLE_NAME = process.env.TABLE_NAME!;



export const handler = async (event: any = {}): Promise<any> => {
    console.log('Event:', event);

    try {
        const { userId } = event.pathParameters;

        if (!userId) {
            return ResponseError(400, 'UserId is required');
        }

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

        const notes: Note[] = await Promise.all(Items.map(async (item: any) => {
            const note: Note = {
                noteId: item.noteId,
                title: item.title,
                content: item.content,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };

            // Check if s3Key exists and generate presigned URL if it does
            if (item.s3Key) {
                note.s3Key = item.s3Key;
                try {
                    note.presignedUrl = await generatePresignedUrl(item.s3Key);
                } catch (error) {
                    console.error(`Error generating presigned URL for note ${note.noteId}:`, error);
                    // We don't add presignedUrl if there's an error, but we keep the note
                }
            }

            return note;
        }));

        return {
            statusCode: 200,
            body: notes,
            message: 'Notes retrieved successfully'
        };
    } catch (error) {
        console.error('Error:', error);
        return ResponseError(500, 'Internal Server Error');
    }
}
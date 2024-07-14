import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ResponseError } from "../utils/responses";
import { generatePresignedUrl } from "../utils/s3_utils";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any = {}): Promise<any> => {
    console.log('Event:', event);

    try {
        const { userId, noteId } = event.pathParameters;

        if (!userId || !noteId) {
            return ResponseError(400, 'UserId and NoteId are required');
        }

        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId, noteId }
        });

        const { Item } = await docClient.send(getCommand);

        console.log('Item:', Item);

        if (!Item) {
            return ResponseError(404, 'Note not found');
        }

        // If the note has an associated S3 object, generate a presigned URL
        if (Item.s3Key) {
            try {
                Item.presignedUrl = await generatePresignedUrl(Item.s3Key);
            } catch (error) {
                console.error(`Error generating presigned URL for note ${noteId}:`, error);
            }
        }

        return {
            statusCode: 200,
            body: Item,
            message: 'Note retrieved successfully'
        };
    } catch (error) {
        console.error('Error:', error);
        return ResponseError(500, 'Internal Server Error');
    }
};
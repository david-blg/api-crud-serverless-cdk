import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ResponseError } from "../utils/utils";

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

        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { userId, noteId },
            ReturnValues: 'ALL_OLD'
        });

        const { Attributes } = await docClient.send(deleteCommand);

        console.log('Attributes:', Attributes);

        if (!Attributes) {
            return ResponseError(404, 'Note not found');
        }

        return {
            statusCode: 200,
            body: Attributes,
            message: 'Note deleted successfully'
        };
    } catch (error) {
        console.error('Error:', error);
        return ResponseError(500, 'Internal Server Error');
    }
};
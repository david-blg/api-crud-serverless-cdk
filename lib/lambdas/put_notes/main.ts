import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { ResponseError, ResponseNotFound, validateFields, validateRequest } from "../utils/responses";
import { uploadObject } from "../utils/s3_utils";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Get resource names from environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Interface defining the structure of a note
interface Note {
  userId: string;
  noteId: string;
  title: string;
  content: string;
  createdAt: string;  
  updatedAt: string;  
  s3Key?: string;
}

export const handler = async (event: any): Promise<any> => {
  console.log('Event:', event);
  try {
    // Validate the request and required fields
    const requestBody = validateRequest(event);
    if ('statusCode' in requestBody) return requestBody;

    const bodyFields = validateFields(requestBody);
    if ('statusCode' in bodyFields) return bodyFields;

    const { userId, title, content, filePath } = bodyFields;
    const noteId = event.pathParameters?.noteId || uuidv4();
    const timestamp = new Date().toISOString();

    let note: Note;
    let isUpdate = false;

    // Check if it's an update or a new note
    if (event.pathParameters?.noteId) {
      // Look for existing note
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId }
      });
      const { Item } = await docClient.send(getCommand);

      if (!Item) {
        return ResponseNotFound(404, 'NoteId not found, should be created');
      }

      isUpdate = true;
      note = {
        ...Item as Note,
        title,
        content,
        updatedAt: timestamp
      };
    } else {
      // Create a new note
      note = {
        userId,
        noteId,
        title,
        content,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }

    // Upload file to S3 if provided
    if (filePath) {
      // extract original file name from filePath if provided
      const originalFileName = filePath ? filePath.split('/').pop() : '';
      const s3Key = `user-${userId}/noteId-${noteId}/${originalFileName}`;
      await uploadObject(s3Key, filePath);
      note.s3Key = s3Key;
    }

    // Save or update the note in DynamoDB
    if (isUpdate) {
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId },
        UpdateExpression: 'set title = :t, content = :c, updatedAt = :u, s3Key = :s',
        ExpressionAttributeValues: {
          ':t': note.title,
          ':c': note.content,
          ':u': note.updatedAt,
          ':s': note.s3Key
        },
        ReturnValues: 'ALL_NEW'
      });
      await docClient.send(updateCommand);
    } else {
      const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: note
      });
      await docClient.send(putCommand);
    }

    // Return the created or updated note
    return {
      statusCode: isUpdate ? 200 : 201,
      body: note,
      message: isUpdate ? 'Note updated successfully' : 'Note created successfully'
    };
  } catch (error) {
    console.error('Error:', error);
    return ResponseError(500, 'Internal Server Error');
  }
};

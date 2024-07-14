import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import { ResponseError, ResponseNotFound, validateFields, validateRequest } from "../utils/responses";
import { uploadObject } from "../utils/s3_utils";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

interface Note {
  userId: string;
  noteId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  s3Key?: string;
}

export const handler = async (event: any): Promise<any> => {
  console.log('Event:', event);
  try {
    const requestBody = validateRequest(event);
    if ('statusCode' in requestBody) return requestBody;

    const bodyFields = validateFields(requestBody);
    if ('statusCode' in bodyFields) return bodyFields;

    const { userId, title, content, filePath } = bodyFields;
    const noteId = event.pathParameters?.noteId || uuidv4();
    const timestamp = Date.now();

    let note: Note;
    let isUpdate = false;

    if (event.pathParameters?.noteId) {
      // Check if the note exists
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, noteId }
      });
      const { Item } = await docClient.send(getCommand);

      if (!Item) {
        ResponseNotFound(404, 'NoteId not found, should be created');
      }

      isUpdate = true;
      note = {
        ...Item as Note,
        title,
        content,
        updatedAt: timestamp
      };
    } else {
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
      const s3Key = `${title}/${noteId}/${filePath.split('/').pop()}`;
      await uploadObject(s3Client, BUCKET_NAME, s3Key, filePath);
      note.s3Key = s3Key;
    }

    // Save or update note in DynamoDB
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

    return {
      statusCode: isUpdate ? 200 : 201,
      body: JSON.stringify(note)
    };
  } catch (error) {
    console.error('Error:', error);
    return ResponseError(500, 'Internal Server Error');
  }
};
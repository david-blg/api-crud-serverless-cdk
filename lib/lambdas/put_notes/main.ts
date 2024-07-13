import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

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
  s3Key?: string;
  filePath?: string;
}

export const handler = async (event: any): Promise<any> => {
  try {
    // Verificar que el cuerpo del evento no esté undefined
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is missing' })
      };
    }

    // Intentar parsear el cuerpo del evento
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Request body is not valid JSON' })
      };
    }

    const { userId, title, content, filePath } = requestBody;

    // Verificar que los campos requeridos no estén vacíos
    if (!userId || !title || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    const noteId = event.pathParameters?.noteId || uuidv4();
    const createdAt = Date.now();

    // Subir archivo a S3
    const s3Key = `${userId}/${title}-${noteId}/${filePath}`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: filePath
    });

    await s3Client.send(putObjectCommand);

    const note: Note = {
      userId,
      noteId,
      title,
      content,
      createdAt,
      s3Key
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: note,
      ConditionExpression: event.pathParameters?.noteId 
        ? 'attribute_exists(noteId)' 
        : 'attribute_not_exists(noteId)'
    });

    await docClient.send(command);

    return {
      statusCode: event.pathParameters?.noteId ? 200 : 201,
      body: JSON.stringify(note)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};

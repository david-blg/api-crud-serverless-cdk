import { RemovalPolicy } from "aws-cdk-lib";
import {
    AttributeType,
    BillingMode,
    StreamViewType,
    Table,
    TableEncryption,
    ProjectionType
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface NotesTableProps {
    tableName: string;
    enableStreams?: boolean;
    enablePointInTimeRecovery?: boolean;
    billingMode?: BillingMode;
}

export const createNotesTable = (scope: Construct, props: NotesTableProps) => {
    const {
        tableName,
        enableStreams = false,
        enablePointInTimeRecovery = true,
        billingMode = BillingMode.PAY_PER_REQUEST
    } = props;

    const table = new Table(scope, tableName, {
        tableName,
        partitionKey: {
            name: 'userId',
            type: AttributeType.STRING
        },
        sortKey: {
            name: 'noteId',
            type: AttributeType.STRING
        },
        billingMode,
        encryption: TableEncryption.AWS_MANAGED, // If you want to use a Customer Managed Key, use TableEncryption.CUSTOMER_MANAGED and provide the key as a parameter
        removalPolicy: RemovalPolicy.DESTROY,
        pointInTimeRecovery: enablePointInTimeRecovery,
        timeToLiveAttribute: 'ttl',
        stream: enableStreams ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,
    });

    // Índice secundario global por título
    table.addGlobalSecondaryIndex({
        indexName: 'TitleIndex',
        partitionKey: {
            name: 'userId',
            type: AttributeType.STRING
        },
        sortKey: {
            name: 'title',
            type: AttributeType.STRING
        },
        projectionType: ProjectionType.ALL,
    });

    // Índice secundario global por fecha de creación
    table.addGlobalSecondaryIndex({
        indexName: 'CreatedAtIndex',
        partitionKey: {
            name: 'userId',
            type: AttributeType.STRING
        },
        sortKey: {
            name: 'createdAt',
            type: AttributeType.NUMBER
        },
        projectionType: ProjectionType.ALL,
    });

    return table;
}
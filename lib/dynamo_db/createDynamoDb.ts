import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, StreamViewType, Table, TableEncryption, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";

interface NotesTableProps {
    tableName: string;
    enableStreams?: boolean;
    enablePointInTimeRecovery?: boolean;
    billingMode?: BillingMode;
    kmsKey: Key;
}

export const createNotesTable = (scope: Construct, props: NotesTableProps) => {
    const {
        tableName,
        enableStreams,
        enablePointInTimeRecovery,
        billingMode = BillingMode.PAY_PER_REQUEST,
        kmsKey
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
        encryption: kmsKey ? TableEncryption.CUSTOMER_MANAGED : TableEncryption.DEFAULT,
        encryptionKey: kmsKey,
        removalPolicy: RemovalPolicy.DESTROY,
        pointInTimeRecovery: enablePointInTimeRecovery,
        timeToLiveAttribute: 'ttl',
        stream: enableStreams ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,
    });

    // Global secondary index by title
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

    // Global secondary index by creation date
    table.addGlobalSecondaryIndex({
        indexName: 'CreatedAtIndex',
        partitionKey: {
            name: 'userId',
            type: AttributeType.STRING
        },
        sortKey: {
            name: 'createdAt',
            type: AttributeType.STRING
        },
        projectionType: ProjectionType.ALL,
    });

    return table;
}
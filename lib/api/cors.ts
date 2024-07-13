import { Duration } from "aws-cdk-lib";
import { Cors, IResource } from "aws-cdk-lib/aws-apigateway";

export const addCorsOptions = (resource: IResource, methods: string[]) => {
    resource.addCorsPreflight({
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: methods,
        allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: Duration.days(1),
    });
};
import { RequestValidator, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { IValidators } from "./types";


export const BODY_VALIDATOR: IValidators = {
    requestValidatorName: "bodyValidator",
    validateRequestBody: true,
    validateRequestParameters: false,
};

export const PARAM_VALIDATOR: IValidators = {
    requestValidatorName: "paramValidator",
    validateRequestBody: false,
    validateRequestParameters: true,
};

export const createValidators = (scope: Construct, api: RestApi, input: IValidators): RequestValidator => 
    new RequestValidator(scope, input.requestValidatorName, {
        restApi: api,
        validateRequestBody: input.validateRequestBody,
        validateRequestParameters: input.validateRequestParameters,
    });
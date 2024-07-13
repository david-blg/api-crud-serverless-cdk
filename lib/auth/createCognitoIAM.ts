import { AccountRecovery, OAuthScope, UserPool } from "aws-cdk-lib/aws-cognito"
import { Construct } from "constructs"

interface CognitoIAMProps {
    userPoolName: string
    domainPrefix: string
}

export const createCognitoIAM = (scope: Construct, props: CognitoIAMProps) => {
    const { userPoolName, domainPrefix } = props

    // Create a Cognito User Pool
    const userPool = new UserPool(scope, userPoolName, {
        userPoolName,
        smsRole: undefined,
        selfSignUpEnabled: true,
        signInAliases: {
            email: true
        },
        autoVerify: {
            email: true
        },
        standardAttributes: {
            email: {
                required: true,
                mutable: true
            }
        },
        passwordPolicy: {
            minLength: 8,
            requireLowercase: true,
            requireDigits: true,
            requireSymbols: true,
            requireUppercase: true
        },
        accountRecovery: AccountRecovery.EMAIL_ONLY,
    })

    // Create a Cognito User Pool Client 
    const client = userPool.addClient('UserPoolClient', {
        userPoolClientName: 'UserPoolClient',
        generateSecret: false,
        authFlows: {
            // userPassword: true,
            userSrp: true
        },
        oAuth: {
            flows: {
                authorizationCodeGrant: true,
            },
            scopes: [
                OAuthScope.OPENID,
            ],
        }
    })

    // Create a Cognito User Pool Domain
    const domain = userPool.addDomain('UserPoolDomain', {
        cognitoDomain: {
            domainPrefix,
        }
    })

    return userPool
}
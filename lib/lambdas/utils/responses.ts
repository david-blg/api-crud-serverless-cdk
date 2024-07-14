export const validateRequest = (event: any) => {
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Request body is missing' })
        };
    }
    try {
        return JSON.parse(event.body);
    } catch (parseError) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Request body is not valid JSON' })
        };
    }
}

export const validateFields = (requestBody: any) => {
    const { userId, title, content, filePath } = requestBody;
    if (!userId || !title || !content) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields' })
        };
    }
    return { userId, title, content, filePath };
}


export const ResponseNotFound = (statusCode: number, message: string) => {
    return {
        statusCode,
        body: JSON.stringify({ message })
    };
}


export const ResponseSuccess = (statusCode: number, message: string, data: any) => {
    return {
        statusCode,
        body: JSON.stringify({ message, data })
    };
}

export const ResponseError = (statusCode: number, message: string) => {
    return {
        statusCode,
        body: JSON.stringify({ message })
    };
}
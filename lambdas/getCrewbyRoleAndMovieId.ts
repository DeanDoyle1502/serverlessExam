import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const pathParameters = event.pathParameters;

   
    if (!pathParameters || !pathParameters.role || !pathParameters.movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing role or movieId in path parameters" }),
      };
    }

    const { role, movieId } = pathParameters;

    
    const movieIdNum = parseInt(movieId, 10);
    if (isNaN(movieIdNum)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid movieId" }),
      };
    }

    const queryCommand = new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m and crewRole = :r",
      ExpressionAttributeValues: {
        ":m": movieIdNum,
        ":r": role,
      },
    });

    const queryResult = await ddbDocClient.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No crew members found " }),
      };
    }

    const crewNames = queryResult.Items.map((item: any) => item.name);

    return {
      statusCode: 200,
      body: JSON.stringify({ crew: crewNames }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error }),
    };
  }
};

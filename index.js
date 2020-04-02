const aws = require("aws-sdk");
var ddb = new aws.DynamoDB({ apiVersion: "2012-08-10" });
var ses = new aws.SES();
aws.config.update({ region: "us-east-1" });
var docClient = new aws.DynamoDB.DocumentClient();
exports.emailService = function(event, context, callback) {
    let message = event.Records[0].Sns.Message;
    let messageJson = JSON.parse(message);
    let messageDataJson = JSON.parse(messageJson.data);
    console.log("Test Message: " + messageJson.data);
    console.log("Test Link: " + messageDataJson.link);
    console.log("Test Email: " + messageDataJson.Email);
    let currentTime = new Date().getTime();
    let ttl = 15*60*1000;
    let expirationTime = (currentTime + ttl).toString();
    var emailParams = {
        Destination: {
          /* required */
          ToAddresses: [
            messageDataJson.Email
            /* more items */
          ]
        },
        Message: {
          /* required */
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: messageDataJson.link
            }
          },
          Subject: {
            Charset: "UTF-8",
            Data: "Bill Link"
          }
        },
        Source: "csye6225@"+process.env.DOMAIN_NAME /* required */
      };

      let putParams = {
        TableName: "csye6225",
        Item: {
          id: { S: messageDataJson.Email },
          resetlink: { S: messageDataJson.link },
          ttl: { N: expirationTime }
        }
      };
      let queryParams = {
        TableName: 'csye6225',
      Key: {
        'id': {S: messageDataJson.Email}
      },
      };
}


const aws = require("aws-sdk");
var ddb = new aws.DynamoDB({ apiVersion: "2012-08-10" });
var ses = new aws.SES();
aws.config.update({ region: "us-east-1" });

exports.emailService = function(event, context, callback) { 

  let message = event.Records[0].Sns.Message;
  let messageJson = JSON.stringify(message);

  let messageDataJson = JSON.stringify(messageJson);
  console.log("Test Message: " + messageJson);
  // console.log("Test Link: " + messageDataJson.Response_Msg);
  // console.log("Test Email: " + messageDataJson.Response_email);


  // const Response = {
  //   Response_Msg: Response_Message,
  //   Response_email: user.email_address,
  // };

  let currentTime = new Date().getTime();
  let ttl = 1*60*1000; 

  let expirationTime = (currentTime + ttl).toString();

  var emailParams = {
    Destination: {
      /* required */
      ToAddresses: [
        messageDataJson.Response_email
        /* more items */
      ]
    },
    Message: {
      /* required */
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: messageDataJson.Response_Msg
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Due Bills"
      }
    },
    Source: "csye6225@"+process.env.DOMAIN_NAME /* required */ //w
  };


  let putParams = {
    TableName: "csye6225",
    Item: {
      id: { S: messageDataJson.Response_email },
      bills: { S: messageDataJson.data },
      ttl: { N: expirationTime }
    }
  };

  let queryParams = {
    TableName: 'csye6225',
  Key: {
    'id': {S: messageDataJson.Response_email}
  },
  };

/////////////////////////////////////////////



ddb.getItem(queryParams, (err, data) => {
    if(err) console.log(err)
    else{

  // first get item and check if email id exists
  //if does not exist put item and send email,

    if (data.Item == null) {

      ddb.putItem(putParams, (err, data) => {
        if (err) console.log(err);
        else {
          console.log(data);
          var sendPromise = ses.sendEmail(emailParams).promise();
          sendPromise
            .then(function(data) {
              console.log(data.MessageId);
            })
            .catch(function(err) {
              console.error(err, err.stack);
            });
        }
      });
    } else {

      let jsonData = JSON.stringify(data)
      let parsedJson = JSON.parse(jsonData);
      let currentDate = new Date().getTime();
      let ttl = Number(parsedJson.Item.ttl.N);
      console.log(typeof currentDate + ' '+ currentDate);
      console.log(typeof ttl+  ' '+ ttl);

 
      if (currentDate > ttl) {

          ddb.putItem(putParams, (err, data) => {
        if (err) console.log(err);
        else {
          console.log(data);
          console.log('sent from 1st function')
          var sendPromise = ses.sendEmail(emailParams).promise();
          sendPromise
            .then(function(data) {
              console.log(data.MessageId);
            })
            .catch(function(err) {
              console.error(err, err.stack);
            });
        }
     });

      }
    }}
  });
};

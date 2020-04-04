console.log("prashant")

const aws = require("aws-sdk");
var ddb = new aws.DynamoDB({ apiVersion: "2012-08-10" });
var ses = new aws.SES();
aws.config.update({ region: "us-east-1" });

exports.emailService = function(event, context, callback) { 

  let message = event.Records[0].Sns.Message;
  // let messageJson = JSON.stringify(message);
 console.log(message);
  // let messageDataJson = JSON.stringify(messageJson);

  // let messageJson1 = JSON.parse(messageDataJson);
  

  // let messageJson = message;
  // let Body = messageJson.Body;
   message = JSON.parse(message);
   let messages = message.Messages[0].Body
   let body = JSON.parse(messages)



  
  
  
  // console.log("Test Message: " + messageJson);
  // console.log("stringify"+ JSON.stringify(messageJson))
  // console.log("Body: " + Body);
  
  // console.log("body" + messageJson.Messages);
  

  console.log("Test Link: " + body.Response_Msg);
  console.log("Test Email: " + body.Response_email);
  
  let urls = body.Response_Msg;
  let emailBody = "Hi, \n Your following Bills are due \n\n";

  
  for(let i=0 ; i < urls.length; i++){
    emailBody += urls[i].url;
    emailBody += "\n ";
  }
  emailBody += "\n Thanks, \n "+process.env.DOMAIN_NAME;
  
  


  // const Response = {
  //   Response_Msg: Response_Message,
  //   Response_email: user.email_address,
  // };

  let currentTime = new Date().getTime();
  let ttl = 10*60*1000; 

  let expirationTime = (currentTime + ttl).toString();

  var emailParams = {
    Destination: {
      /* required */
      ToAddresses: [
        body.Response_email
        /* more items */
      ]
    },
    Message: {
      /* required */
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: emailBody
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
      id: { S: body.Response_email },
      ttl: { N: expirationTime }
    }
  };

  let queryParams = {
    TableName: 'csye6225',
  Key: {
    'id': {S: body.Response_email}
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

const AWS = require('aws-sdk');

const AWS_CREDENTIAL = {
  accessKeyId: process.env['awsAccessID'],
  secretAccessKey: process.env['awsSecretKey'],
  region: process.env['awsRegion']
};

async function s3Upload(inputStream, bucket, s3Key) {
  const s3 = new AWS.S3(AWS_CREDENTIAL)
  var respond = null;

  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: inputStream
  };

  try{
    respond = await s3.upload(params).promise();
  }
  catch (error) {
    console.log(error);
    return;
  }
  console.log(`File uploaded successfully at ${respond["Location"]}`);
}

async function s3Read(bucket, s3Key) {
  const s3 = new AWS.S3(AWS_CREDENTIAL);
  var data = '';

  const params = {
    Bucket: bucket,
    Key: s3Key
  }

  var tmp = null;          //Default return null
  var timeout = 10;
  try {
    data = await s3.getObject(params).promise();
    tmp = Buffer.from(data['Body']).toString();
  }
  catch (error) {
    console.log(error);
  }
  
  return tmp;
}

module.exports = {
  s3Upload,
  s3Read
}

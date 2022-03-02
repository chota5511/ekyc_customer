const AWS = require('aws-sdk');

const AWS_CREDENTIAL = {
  accessKeyId: process.env['awsAccessID'],
  secretAccessKey: process.env['awsSecretKey'],
  region: process.env['awsRegion']
};

function s3Upload(inputStream, bucket, s3Key) {
   const s3 = new AWS.S3(AWS_CREDENTIAL)

   const params = {
      Bucket: bucket,
      Key: s3Key,
      Body: inputStream
   };

  const data = s3.upload(params, function(s3Err, data) {
    if (s3Err) throw s3Err
    console.log(`File uploaded successfully at ${data.Location}`)
  });
}

async function s3Read(bucket, s3Key) {
  const s3 = new AWS.S3(AWS_CREDENTIAL);

  const params = {
    Bucket: bucket,
    Key: s3Key
  }

  var tmp = null;          //Default return null
  var timeout = 10;

  const data = await s3.getObject(params).promise();

  tmp = Buffer.from(data['Body']).toString();
  
  return tmp;
}

module.exports = {
  s3Upload,
  s3Read
}

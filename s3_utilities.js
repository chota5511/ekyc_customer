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

module.exports = {
  s3Upload
}
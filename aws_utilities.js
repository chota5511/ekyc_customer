const AWS = require('aws-sdk');
const sleep = require('system-sleep')

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

function s3Read(bucket, s3Key) {
  const s3 = new AWS.S3(AWS_CREDENTIAL);

  const params = {
    Bucket: bucket,
    Key: s3Key
  }

  var tmp = null;          //Default return null
  var timeout = 10;

  const data = s3.getObject(params, (s3Err, data) => {
    if (s3Err) throw s3Err
    //console.log(data)

    tmp = new Buffer.from(data["Body"]).toString('utf8');
  })

  //Make thing sync
  do {
    if (tmp != null) {
      break;
    }
    else {
      timeout--;
      sleep(1000);
    }
  } while(timeout > 0);
  if (timeout <= 0) {
    console.log('Request timeout!!!');
  }
  return tmp;
}

module.exports = {
  s3Upload,
  s3Read
}

const pg = require('pg');
const json_utilities = require('./json_utilities.js');
const aws_utilities = require('./aws_utilities.js');
const utilities = require('./utilities.js');

const configureKey = process.env['configureKey'];
const dbUserName = process.env['dbUserName'];
const dbHost = process.env['dbHost'];
const dbName = process.env['dbName'];
const dbPassword = process.env['dbPassword'];

var configureFile = {};

async function main() {
  //Initial variables
  var maxUpdatedAt = null;
  var lastRunQueryStr = '';
  var queryStr = '';
  var dataFields = [];
  var data = '';

  const result = {
    "Start datetime": '',
    "End datetime": '',
    "Execution": {
      "Query": '',
      "Respond query": '',
      "Status": '',
      "Failed reason": ''
    }
  };

  //Create connection string
  const connection = {
    user: dbUserName,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: 5234
  };

  result["Start datetime"] = new Date();
  console.log(`Start getting data: ${result["Start datetime"]}`);

  //Create connection
  var client = new pg.Client(connection);

  //Open connection
  await client.connect();

  //Begin getting data

  //Getting lated updated at in ekyc_customer
  try {
    maxUpdatedAt = (await client.query(`SELECT MAX(updated_at)::TEXT FROM ekyc_customer`))['rows'][0]['max'];
  }
  catch (error) {
    console.log(error);
    result["Execution"]['Failed reason'] = error;
    result["End datetime"] = new Date();
    result['Execution']["Status"] = 'Failed';

    //End connection immidiately after an error and return result with failed status
    client.end();
    return result;
  }

  //Getting data in range
  console.log('Getting data at: ' + maxUpdatedAt);

  //Build and fill all data from last time run (if ekyc_updated_at is null then crawl all data)
  if (configureFile["ekyc_updated_at"] != '') {
    lastRunQueryStr = `AND updated_at > '${configureFile["ekyc_updated_at"]}'::TIMESTAMP`;
  }
  queryStr = `SELECT * FROM ekyc_customer WHERE updated_at <= '${maxUpdatedAt}'::TIMESTAMP ${lastRunQueryStr}`;

  //Update result with query string
  result["Execution"]["Query"] = queryStr;

  try {
    data = await client.query(queryStr);

    //Create table schema (fields)
    for (var i in data["fields"])
    {
      dataFields.push(JSON.parse(JSON.stringify(data["fields"][i]["name"])).toString());
    }

    //Update result with data respond
    result["Execution"]["Respond query"] = data;

    //Push data to a CSV file
    data = json_utilities.jsonToCsv(data["rows"],dataFields);

    //Save CSV file to S3
    aws_utilities.s3Upload(data,awsEkycBucket,`ekyc_customer_${utilities.today()}.csv`);

    //Update config file
    configureFile["ekyc_updated_at"] = maxUpdatedAt;
    aws_utilities.s3Upload(JSON.stringify(configureFile),awsEkycBucket,configureKey);
  }
  catch (error) {
    console.log(error);
    result["Execution"]['Failed reason'] = error;
    result["End datetime"] = new Date();
    result['Execution']["Status"] = 'Failed';

    //End connection immidiately after an error and return result with failed status
    client.end();
    return result;
  }

  //Return result
  result["End datetime"] = new Date();
  result["Execution"]["Status"] = 'Success';
  client.end();
  console.log(`End getting data: ${result["End datetime"]}`);
  return result;
}

async function run() {
  configureFile = JSON.parse(await aws_utilities.s3Read('acbs-test-data',configureKey)) ?? json_utilities.readJSON('./configuration.json');

  console.log(JSON.stringify(configureFile));

  //Run main function
  return main();
}
run();
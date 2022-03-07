const pg = require('pg');
const json_utilities = require('./json_utilities.js');
const aws_utilities = require('./aws_utilities.js');
const utilities = require('./utilities.js');

const configureFileLocation = "acbs-test-data";
const configureKey = "configuration.json";
const configureRequire = ['db_host','db_name','db_user_name','db_password','ekyc_bucket'];

//configuration variables
var dbUserName = "";
var dbHost = "";
var dbName = "";
var dbPassword = "";
var awsEkycBucket = "";

var configureFile = {};

var result = {
  "Start datetime": '',
  "End datetime": '',
  "Execution": {
    "Query": '',
    "Respond query": '',
    "Status": '',
    "Failed reason": ''
  },
  "Upload status": {
    "Data file": '',
    "Configuration": ''
  }
};

async function configurationCheck() {
  for (i in configureRequire) {
    if ((configureFile[configureRequire[i]] ?? '') == '') {
      return configureRequire[i];
    }
  }
  return true;
}

async function main() {
  //Initial variables
  var maxUpdatedAt = '';
  var lastRunQueryStr = '';
  var queryStr = '';
  var dataFields = [];
  var data = '';
  var promiseStack = [];
  var uploadStatus = [];

  //Create connection string
  const connection = {
    user: dbUserName,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: 5234
  };

  //Create connection
  var client = new pg.Client(connection);

  //Open connection
  await client.connect();

  //Begin getting data

  //Getting latest updated_at in ekyc_customer
  try {
    maxUpdatedAt = (await client.query(`SELECT MAX(updated_at)::TEXT FROM ekyc_customer`))['rows'][0]['max'];
  }
  catch (error) {
    console.log(error);
    result["Execution"]['Failed reason'] = error;
    result["End datetime"] = new Date();
    result['Execution']["Status"] = 'Failed';

    //End connection immidiately after an error and return result with failed status
    console.error(result);
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
    data = await json_utilities.jsonToCsv(data["rows"],dataFields);

    //Save CSV file to S3
    promiseStack.push(aws_utilities.s3Upload(data,awsEkycBucket,`ekyc_customer_${utilities.today()}.csv`));

    //Update config file
    configureFile["ekyc_updated_at"] = maxUpdatedAt;
    promiseStack.push(aws_utilities.s3Upload(JSON.stringify(configureFile),awsEkycBucket,configureKey));

    //Wait for all promise to complete
    uploadStatus = await Promise.allSettled(promiseStack);
    result["Upload status"]["Data file"] = uploadStatus[0]["status"];
    result["Upload status"]["Configuration"] = uploadStatus[1]["status"];
  }
  catch (error) {
    console.log(error);
    result["Execution"]['Failed reason'] = error;
    result["End datetime"] = new Date();
    result['Execution']["Status"] = 'Failed';

    //End connection immidiately after an error and return result with failed status
    console.error(result);
    client.end();
    return result;
  }

  //Return result
  client.end();
}

//exports.handler = async function (event, context) {
async function run () {
  result["Start datetime"] = new Date();
  console.log(`Start getting data: ${result["Start datetime"]}`);

  //Getting configuration, if s3 configuration not fould then get setting from default
  console.log(`Getting configuration from AWS S3...`)
  configureFile = JSON.parse(await aws_utilities.s3Read(configureFileLocation,configureKey)) ?? json_utilities.readJSON('./configuration.json');

  console.log(`Checking configuration data file`)
  var configCheckResult = await configurationCheck();                                                     //If configCheckResult != true then return a missing configuration
  if (configCheckResult != true) {
    result["Execution"]['Failed reason'] = `Missing ${configCheckResult} in configuration`;
    result['Execution']["Status"] = 'Failed';
    result["End datetime"] = new Date();
    console.error(result);
    return result;
  }
  //console.log(JSON.stringify(configureFile));

  //Parsing config from configuration file
  dbHost = configureFile["db_host"];
  dbName = configureFile["db_name"];
  dbUserName = configureFile["db_user_name"];
  dbPassword = configureFile["db_password"];
  awsEkycBucket = configureFile["ekyc_bucket"];

  //Run main function
  await main()

  result["End datetime"] = new Date();
  result["Execution"]["Status"] = 'Success';
  console.log(`End getting data: ${result["End datetime"]}`);

  return result;
}
run();

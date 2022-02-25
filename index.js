const pg = require('pg');
const json_utilities = require('./json_utilities.js');
const aws_utilities = require('./aws_utilities.js');
const utilities = require('./utilities.js');

const configureKey = process.env['configureKey'];
const dbUserName = process.env['dbUserName'];
const dbHost = process.env['dbHost'];
const dbName = process.env['dbName'];
const dbPassword = process.env['dbPassword'];

const awsAccessID = process.env["awsAccessID"];
const awsSecretKey = process.env["awsSecretKey"];
const awsEkycBucket = process.env["awsEkycBucket"];

const configureFile = JSON.parse(aws_utilities.s3Read('acbs-test-data',configureKey));

const result = {
  "Start datetime": '',
  "End datetime": '',
  "Execution": {
    "Query": '',
    "Respond query": '',
    "Status": 'Failed'
  }
}

result["Start datetime"] = new Date();

console.log(configureFile);

//Create client connection
const connection = {
  user: dbUserName,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: 5234
};
var client = new pg.Client(connection);

//Open connection
client.connect();

//Begin getting data
client.query(`SELECT MAX(updated_at)::TEXT FROM ekyc_customer`).then((max_updated_at,err) => {            //Run query to get lasted updated data date time
  if (err) {
    console.log(err);
    client.end();                                                                                         //Close connection if err
    result["End datetime"] = new Date();
    console.log(JSON.stringify(result));;
  }
  else {
    var updatedAt = max_updated_at['rows'][0]['max'];
    console.log('Getting data at: ' + updatedAt);

    //Build fill all data from last time run (if ekyc_updated_at is null then crawl all data)
    var last_run_query_str = '';
    if (configureFile["ekyc_updated_at"] != '') {
      last_run_query_str = `AND updated_at > '${configureFile["ekyc_updated_at"]}'::TIMESTAMP`
    }
    var query_str = `SELECT * FROM ekyc_customer WHERE updated_at <= '${updatedAt}'::TIMESTAMP ${last_run_query_str}`;
    result["Execution"]["Query"] = query_str;
    
    client.query(query_str).then((data_res,err1) => {                                                        //Run query for gather data
      if (err1) {
        console.log(err1);
        client.end();
        result["End datetime"] = new Date();
        console.log(JSON.stringify(result));;
      }
      else {
        var fields = [];
        var data = '';

        //Create table schema (fields)
        for (var i in data_res["fields"])
        {
          fields.push(JSON.parse(JSON.stringify(data_res["fields"][i]["name"])).toString());
        }

        result["Respond query"] = data_res;

        //Push data to a CSV file
        data = json_utilities.jsonToCsv(data_res["rows"],fields)

        //Save CSV file to S3
        aws_utilities.s3Upload(data,awsEkycBucket,`ekyc_customer_${utilities.today()}.csv`);

        //Update config file
        configureFile["ekyc_updated_at"] = updatedAt;
        aws_utilities.s3Upload(JSON.stringify(configureFile),awsEkycBucket,configureKey);

        //Return result
        result["End datetime"] = new Date();
        result["Execution"]["Status"] = 'Success';
        console.log(JSON.stringify(result));
        
        //Close connection
        client.end();
      }
    });
  }
});
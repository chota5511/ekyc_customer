const DateFormat = require('./dateformat.js');

function today() {
  return DateFormat.dateFormat(new Date(), "yyyymmdd");
}

function standardizedDateMonthDigit(number) {
  if(number.toString().length == 1) {
    result = `0${number}`;
  }
  else {
    result = number.toString();
  }
  return result;
}

function requestBody(json_request_body) {
  //json_request_body = JSON.parse(json_request_body);
  var request_body = [];

  for (var i in json_request_body) {
  request_body.push(`${encodeURIComponent(i)}=${encodeURIComponent(json_request_body[i])}`);
  }

  request_body = request_body.join('&');

  return request_body;
}

function readFile(filepath) {
  
}

function utiTest() {
  for(var i=1;i<=31;i++) {
    console.log(standardizedDateMonthDigit(i));
    i++;
  }
}

module.exports = {
  requestBody,
  standardizedDateMonthDigit,
  today
}
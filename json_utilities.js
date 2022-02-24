const fs = require('fs');

function readJSON(path) {
  let raw = fs.readFileSync(path);
  return JSON.parse(raw);
}

function writeJSON(path,data) {
  fs.writeFile(path,JSON.stringify(data),(err) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(`Save success!`)
    }
  })
}

function jsonItemWithMaxLenthLocation(json) {
  var location = 0;
  var max = 0;
  for (var i in json) {
    if (json[i].length > max) {
      location = i;
      max = json[i].length;
    }
  }
  return location;
}

function isJsonNested(json) {
  var isNested = Object.keys(json).some(function(key) {
    return json[key] && typeof json[key] === 'object';
  });

  return isNested;
}

function jsonKeys(json) {
  var keys = [];
  var json_with_max_length = json[jsonItemWithMaxLenthLocation(json)];
  
  for (var i in json_with_max_length){
    keys.push(i);
  }
  //console.log(keys);
  return keys;
}

function jsonToCsvLine(json,schema) {
  var values = [];

  for (var i in schema){
    var tmp = `${JSON.stringify(json[schema[i]]) ?? ''}`;
    //console.log(tmp)
    values.push(tmp);
  }
  return values;
}

function jsonToCsv(json) {
  var csv = '';
  var schema = jsonKeys(json)
  //Get json key to csv header
  csv += schema.join('|');
  var buffer = [];

  for (var i = schema.length; i > 0; i--) {
    buffer.push("0");
  }

  csv += '\n' + buffer.join('|');

  for (var i in json) {
    csv += `\n${jsonToCsvLine(json[i],schema).join('|')}`;
  }

  csv += '\n' + buffer.join('|');

  return csv;
}

function jsonToCsvWithCustomHeader(json,header) {
  var csv = '';
  var schema = header
  //Get json key to csv header
  csv += schema.join('|');

  for (var i = schema.length; i > 0; i--) {
    buffer.push("0");
  }

  csv += '\n' + buffer.join('|');

  for (var i in json) {
    csv += `\n${jsonToCsvLine(json[i],schema).join('|')}`;
  }

  csv += '\n' + buffer.join('|');

  return csv;
}

function arrayToJson(array) {
  return JSON.parse(JSON.stringify(array))
}

module.exports = {
  arrayToJson,
  jsonToCsv,
  jsonToCsvWithCustomHeader,
  readJSON,
  writeJSON
};

function testJsonUnitilies() {
  /*
  test_json1 = {
    test: 'test1'
  }

  test_json2 = {
    test: {
      test_nested: 'nested'
    }
  }
  console.log('Result 1: ' + isJsonNested(test_json1));
  console.log('Result 2: ' + isJsonNested(test_json2));
  */
  var test_json1 = [
    {
      test1: 'test1',
      test2: 'test1',
      test3: 'test1',
      test4: 'test1',
      test5: 'test1',
      test6: 'test1',
      test7: 'test1',
      test8: 'test1',
      test9: 'test1',
      test10: 'test1'
    },
    {
      test1: 'test2',
      test2: 'test2',
      test3: 'test2',
      test4: 'test2',
      test5: 'test2',
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test9: 'test2',
      test10: 'test2'
    }
  ];

  var test_json2 = [
    {
      test1: 'test1',
      test2: 'test1',
      test3: 'test1',
      test4: 'test1',
      test5: 'test1',
      test6: 'test1',
      test7: '',
      test8: '',
      test9: '',
      test10: 'test1'
    },
    {
      test1: 'test2',
      test2: 'test2',
      test3: '',
      test4: 'test2',
      test5: '',
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test9: 'test2',
      test10: 'test2'
    }
  ];

  var  test_json3 = [
    {
      test1: 'test1',
      test2: 'test1',
      test3: 'test1',
      test4: 'test1',
      test5: 'test1',
      test6: 'test1',
      test7: null,
      test8: null,
      test9: null,
      test10: 'test1'
    },
    {
      test1: 'test2',
      test2: 'test2',
      test3: null,
      test4: 'test2',
      test5: null,
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test9: 'test2',
      test10: 'test2,unexpected'
    }
  ];

  var test_json4 = [
    {
      test1: 'test1',
      test2: 'test1',
      test5: 'test1',
      test6: 'test1',
      test7: null,
      test8: null,
      test9: null,
      test10: 'test1'
    },
    {
      test1: 'test2',
      test2: 'test2',
      test3: null,
      test4: 'test2',
      test5: null,
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test10: 'test2'
    },
        {
      test1: 'test2',
      test2: 'test2',
      test3: null,
      test4: 'test2',
      test5: null,
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test9: 'test2',
      test10: 'test2'
    },
    {
      test1: 'test2',
      test5: null,
      test6: 'test2',
      test7: 'test2',
      test8: 'test2',
      test9: 'test2',
      test10: 'test2'
    }
  ];

  var csv1 = jsonToCsv(test_json1);
  var csv2 = jsonToCsv(test_json2);
  var csv3 = jsonToCsv(test_json3);
  var csv4 = jsonToCsv(test_json4);

  console.log(csv1);
  console.log(csv2);
  console.log(csv3);
  console.log(csv4);

  saveFile('test1.csv',csv1);
  saveFile('test2.csv',csv2);
  saveFile('test3.csv',csv3);
  saveFile('test4.csv',csv4);
}
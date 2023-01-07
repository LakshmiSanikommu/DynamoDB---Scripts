const express = require("express");
const AWS = require("aws-sdk");
require("dotenv").config({ path: "./.env" });

// express
const app = express();
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`listening on port ${PORT} `);
});

// AWS configuration
AWS.config.update({
  region: "us-east-1",
  endpoint: "http://dynamodb.us-east-1.amazonaws.com",
  accessKeyId: "AKIA5F2HZH4O346WPMPO",
  secretAccessKey: "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",
});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// ----------------------------------------------  SCRIPT STARTS HERE --------------------------------------

// table_name = "stage-lp-content-proxy-content";
const table_name = "backup";
const filters = {
  language: "en",
  country: "de",
  platform: "ios",
};

function filtered_doc(filters) {
  var params = {
    TableName: table_name,
    ExpressionAttributeNames: { "#lang": "language" },
    FilterExpression: " #lang = :l AND country = :c AND platform = :p",
    ExpressionAttributeValues: {
      ":l": filters.language,
      ":c": filters.country,
      ":p": filters.platform,
    },
  };

  return docClient.scan(params).promise();
}
let item;

function put_item(item) {
  var params = {
    TableName: table_name,
    Item: item,
  };
  docClient.put(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
}

function update_doc(latest_title, primary_key) {
  var params = {
    TableName: table_name,
    Key: {
      id: primary_key,
    },
    ExpressionAttributeNames: { "#d": "data" },
    UpdateExpression: "set #d.devices.title = :t",
    ExpressionAttributeValues: {
      ":t": latest_title,
    },
  };

  docClient.update(params, function (err, data) {
    if (err) {
      console.log("Error when updating", err);
    } else {
      console.log("Success ", data);
    }
  });
}

async function main() {
  const obj = await filtered_doc(filters);
  // console.log(obj);
  const primary_key = obj.Items[0].id;
  item = obj.Items[0];
  item.data.devices.title = "adding new title to the ios "
  put_item(item)
  console.log(item)
  // update_doc("updating title to new one ", primary_key);
}
main();


// function update_doc(latest_title: string, primary_key: string) {
//   var params = {
//     TableName: table_name,
//     Key: {
//       id: primary_key,
//     },
//     ExpressionAttributeNames: { "#d": "data" },
//     UpdateExpression: "set #d.devices.title = :t",
//     ExpressionAttributeValues: {
//       ":t": latest_title,
//     },
//   };

//   docClient.update(params, function (err: any, data: any) {
//     if (err) {
//       console.log("Error when updating", err);
//     } else {
//       console.log("Success - data after updated ", data);
//     }
//   });
// }

// console.log(typeof item.data);
// typeof item.data == "string" && (item.data = JSON.parse(item.data));
// typeof item.data == "string" && put_item(item);
// put_item(item);

// item.data.devices.title =
//   "You can watch dazn on your Supported devices.\nWatch on any 2 devices at the same time. ";
// put_item(item);
// update_doc(
//   "You can watch dazn on your Supported devices.\nWatch on any 2 devices at the same time.",
//   primary_key
// );

// {
//   filters.description &&
//     filters.description.length > 0 &&
//     (params.ExpressionAttributeValues[":d"] = filters.description) &&
//     (params.ExpressionAttributeNames["#d"] = "data");
// }

// console.log(
//   "---------------------------------- item in map --------------------------------"
// );

// items_returned.map(async (item: any) => {
//   item.data = await JSON.parse(item.data);
//   // console.log(item);
// });
// const primary_key = obj?.Items[0]?.id;
// if (primary_key) {
//   item = obj?.Items[0];
//   item.data = await JSON.stringify(item.data);
//   console.log(item);
// } else {
//   console.log("No primary key found");
// }


  // ---------- This code is to replace multiple titles like for android tv -------------------
  // items_returned = items_returned?.map((item: any) => {
  //   item.data = JSON.parse(item.data);
  //   item.data.devices.title = latest_title;
  //   item.data = JSON.stringify(item.data);
  // put_item(item);
  //   return item;
  // });

// interface ItemType {
//   language: string;
//   country: string;
//   platform: string;
//   id: string;
//   createdDate: string;
//   data: {
//     header: Object,
//     priceSection: Object,
//     sport: Object,
//     devices: Object,
//     exploreButton: Object,
//     sources: Object,
//     pausedUserPage: Object,
//     welcomeBackHeader: Object,
//     showPrice: Object,
//   };
//   manufacturer: string;
//   updatedDate: string;
// }
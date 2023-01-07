const AWS = require("aws-sdk");
require("dotenv").config({ path: "./.env" });
var Validator = require("jsonschema").Validator;

// AWS configuration
AWS.config.update({
  region: "eu-central-1",
  endpoint: "http://dynamodb.eu-central-1.amazonaws.com",
  accessKeyId: process.env.Access_Key_Id,
  secretAccessKey: process.env.Secret_Access_Key,
  sessionToken: process.env.Session_Token,
});

// Create the DynamoDB service object
var dynamodbClient = new AWS.DynamoDB.DocumentClient();

const table_name = "prod-lp-content-proxy-content";
const json_schema = {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    country: {
      type: "string",
    },
    createdDate: {
      type: "string",
    },
    data: {
      type: "string",
    },
    language: {
      type: "string",
    },
    path: {
      type: "string",
    },
    platform: {
      type: "string",
    },
    updatedDate: {
      type: "string",
    },
  },
  required: [
    "id",
    "country",
    "createdDate",
    "data",
    "language",
    "path",
    "platform",
    "updatedDate",
  ],
};

async function filtered_doc(filters, lastEvaluatedKey) {
  var params = {
    TableName: table_name,
    ExpressionAttributeNames: { "#lang": "language" },
    FilterExpression: " #lang = :l AND country = :c AND platform = :p ",
    ExpressionAttributeValues: {
      ":l": filters.language,
      ":c": filters.country,
      ":p": filters.platform,
    },
  };
  lastEvaluatedKey && (params.ExclusiveStartKey = lastEvaluatedKey);

  dynamodbClient.scan(params, function (err, data) {
    if (err) {
      console.log("Error when Filtering \n", err);
    } else {
      // console.log("Success with filtering \n", data);
    }
  });
  return dynamodbClient.scan(params).promise();
}

async function filterById(hashKey) {
  return dynamodbClient
    .query({
      TableName: table_name,
      KeyConditionExpression: "id = :hashKey",
      ExpressionAttributeValues: {
        ":hashKey": hashKey,
      },
    })
    .promise();
}

function put_item(item) {
  var v = new Validator();
  var instance = item;
  let validation_output = v.validate(instance, json_schema);
  console.log(v.validate(instance, json_schema));
  if (typeof item.data === "string" && validation_output.errors.length == 0) {
    var params = {
      TableName: table_name,
      Item: item,
    };
    dynamodbClient.put(params, function (err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success added updated document", data);
      }
    });
  } else {
    console.log(
      " WRITE Operation Denied -- check Object format before and after changes "
    );
  }
}

async function UpdateTitleForIos() {
  let ios_title =
    "You can watch dazn on your Supported devices.\nWatch on any 2 devices at the same time. ";
  const obj = await filterById("35628be0-9c6f-4d9c-8d8c-5cb17cab9923");
  if (obj.Items.length > 0) {
    let items_returned = obj.Items;
    let item = items_returned[0];
    item.data = JSON.parse(item.data);
    item.data.devices.title = ios_title;
    console.log(item);
    // put_item(item);
  } else {
    console.log(" IOS - Items not found ,  please enter the correct hashID ");
  }
}

async function UpdateTitleForAndroid() {
  let android_title =
    "Connect up to 6 Devices. Watch Sport in HD.\nWatch on any 2 devices at the same time.";
  const obj = await filterById("69d4cc92-e061-4f2f-8442-702c5017dcd0");
  if (obj.Items.length > 0) {
    let items_returned = obj.Items;
    let item = items_returned[0];
    item.data = JSON.parse(item.data);
    item.data.devices.title = android_title;
    console.log(item);
    item.data = JSON.stringify(item.data);
    // put_item(item);
  } else {
    console.log(
      " Android - Item not found ,  please enter the correct hasdID "
    );
  }
}

async function UpdatePricesAcrossAndroidTV() {
  let androidtv_price_description =
    "14,99€ per month after trial, cancel monthly.";
  let filters = {
    language: "en",
    country: "de",
    platform: "androidtv",
    // description: "cancel",
  };
  let items_returned = [];
  const obj = await filtered_doc(filters);
  items_returned = obj.Items;
  if (obj.LastEvaluatedKey) {
    const temp_obj = await filtered_doc(filters, obj.LastEvaluatedKey);
    temp_obj.Items.length > 0 &&
      temp_obj.Items?.map((item) => {
        items_returned.push(item);
      });
  }
  console.log(
    "Total number of items found for anddroid tv " + items_returned.length
  );
  console.log(items_returned);

  // if description present this filter executes
  filters.description &&
    (items_returned = items_returned?.filter((item) => {
      item.data = JSON.parse(item.data);
      if (
        Boolean(item.data.priceSection) &&
        item.data.priceSection.description
      ) {
        let desc_in_item = item.data.priceSection.description;
        item.data = JSON.stringify(item.data);
        return desc_in_item.includes(filters.description);
      } else {
        console.log("There is no priceSection in the Object");
        return false;
      }
    }));

  if (obj.Items.length > 0) {
    items_returned?.map(async (item) => {
      item.data = await JSON.parse(item.data);
      item.data.priceSection = {
        description: androidtv_price_description,
      };
      item.data = JSON.stringify(item.data);
      // put_item(item);
    });
  } else {
    console.log(
      " AndroidTV - Items not found , please enter the correct filters "
    );
  }
}

UpdateTitleForAndroid();
UpdateTitleForIos();
UpdatePricesAcrossAndroidTV();

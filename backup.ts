// --------------------------------------  This is for Backup ------------------------

const AWS = require("aws-sdk");
require("dotenv").config({ path: "./.env" });

// AWS configuration
AWS.config.update({
  region: "eu-central-1",
  endpoint: "http://dynamodb.eu-central-1.amazonaws.com",
  accessKeyId: process.env.Access_Key_Id,
  secretAccessKey: process.env.Secret_Access_Key,
  sessionToken: process.env.Session_Token,
});

// Create the DynamoDB service object
var docClient = new AWS.DynamoDB.DocumentClient();

interface FiltersType {
  language: string;
  country: string;
  platform: string;
  description?: string;
}

const table_name = "stage-lp-content-proxy-content";
let filters: FiltersType = {
  language: "en",
  country: "de",
  platform: "androidtv",
  description: "14",
};

async function filtered_doc(filters: FiltersType) {
  var params: any = {
    TableName: table_name,
    ExpressionAttributeNames: { "#lang": "language" },
    FilterExpression: " #lang = :l AND country = :c AND platform = :p ",
    ExpressionAttributeValues: {
      ":l": filters.language,
      ":c": filters.country,
      ":p": filters.platform,
    },
  };

  docClient.scan(params, function (err: any, data: any) {
    if (err) {
      console.log("Error when Filtering \n", err);
    } else {
      console.log("Success with filtering \n", data);
    }
  });

  return docClient.scan(params).promise();
}

function put_item(item: any) {
  var params = {
    TableName: table_name,
    Item: item,
  };
  docClient.put(params, function (err: any, data: any) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success added updated document", data);
    }
  });
}

async function main() {
  let ios_title =
    "You can watch dazn on your Supported devices.\nWatch on any 2 devices at the same time. ";
  let android_title =
    "Connect up to 6 Devices. Watch Sport in HD.\nWatch on any 2 devices at the same time.";
  let androidtv_price_description =
    "14,99€ per month after trial, cancel monthly.";
  const obj = await filtered_doc(filters);
  console.log(obj);
  let items_returned = obj.Items;
  // if description present this filter executes
  filters.description &&
    (items_returned = items_returned?.filter((item: any) => {
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

  try {
    if (filters.platform === "androidtv") {
      // This is to change the priceSection description for AndroidTV
      items_returned.map(async (item: any) => {
        item.data = await JSON.parse(item.data);
        item.data.priceSection = {
          description: androidtv_price_description,
        };
        item.data = JSON.stringify(item.data);
        put_item(item);
      });
    } else {
      // Title replacement for IOS and Android
      let item = items_returned[0];
      item.data = JSON.parse(item.data);
      item.data.devices.title =
        filters.platform == "ios" ? ios_title : android_title;
      item.data = JSON.stringify(item.data);
      put_item(item);
    }
  } catch {
    console.log("No item found , change ur filter to get some items ");
  }
  console.log(items_returned);
}
main();

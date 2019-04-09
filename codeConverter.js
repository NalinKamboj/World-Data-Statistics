const getISO2 = require("country-iso-3-to-2");
const write = require("fs");

let rawData = write.readFileSync("data/mortalityData.json");
let data = JSON.parse(rawData);
// console.log(data);

for (var i = 0; i < data.length; i++) {
  data[i].id = getISO2(data[i]["Country Code"]);
}
var writeObj = { vals: data };

write.writeFile(
  "data/mortalityData2.json",
  JSON.stringify(writeObj, null, 4),
  err => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("File has been created");
  }
);

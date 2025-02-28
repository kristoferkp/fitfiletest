var FitParser = require('./node_modules/fit-file-parser/dist/fit-parser.js').default;
var file = "ACTIVITY.fit";

console.time('FIT parsing');

export function parseFitFile(content) {
  return new Promise((resolve, reject) => {
    var fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      pressureUnit: 'bar',
      elapsedRecordField: true,
      mode: 'both',
    });

    fitParser.parse(new Uint8Array(content), function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

Bun.file(file).arrayBuffer()
  .then(function (content) {
    parseFitFile(content)
      .then((data) => {
        let jsonData = JSON.stringify(data, null, 2);
        Bun.write("parsedData.json", jsonData)
          .then(() => {
            console.timeEnd('FIT parsing');
            console.log("Data saved to parsedData.json");
          })
          .catch(console.error);
      })
      .catch(console.error);
  })
  .catch(function (error) {
    console.error(error);
  });
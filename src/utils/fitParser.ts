import FitParser from 'fit-file-parser';

export function parseFitFile(content: ArrayBuffer) {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
    });

    try {
      fitParser.parse(new Uint8Array(content), (error: Error, data: any) => {
        if (error) {
          console.error('FIT parsing error:', error);
          reject(error);
        } else {
          // Validate data structure
          if (!data || typeof data !== 'object') {
            reject(new Error('Invalid data structure from FIT parser'));
            return;
          }

          // Ensure records array exists
          data.records = data.records || [];
          
          console.log('FIT parsing successful:', {
            recordsCount: data.records.length,
            dataKeys: Object.keys(data)
          });
          
          resolve(data);
        }
      });
    } catch (error) {
      console.error('FIT parsing exception:', error);
      reject(error);
    }
  });
}

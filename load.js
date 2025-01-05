const fs = require('fs');
const firebaseAdmin = require('firebase-admin');

const serviceAccount = require('./adminsdk.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

const db = firebaseAdmin.firestore();

const processFile = async () => {
  try {
    const data = fs.readFileSync("./times.txt", 'utf8');
    const stops = fs.readFileSync("./stops.txt", 'utf8');
    const trips = fs.readFileSync("./trips.txt", 'utf8');

    const lines = data.split('\n');
    const stop_lines = stops.split('\n');
    const trip_lines = trips.split('\n');

    const tableNames = lines[0].split(',');

    const ids = [];
    let trip = {};
    for (let i = 1; i < stop_lines.length; i++) {
      const values = stop_lines[i].split(',');
      ids.push(parseInt(values[0]))
    }
    for (let i = 1; i < trip_lines.length; i++) {
      const values = trip_lines[i].split(',');
      trip[parseInt(values[2])] = values[4];
    }
    console.log(trip);
    for (let i = 1; i < lines.length; i++) {
      const dataObject = {};
      const values = lines[i].split(',');
      const docRef = db.collection("times").doc();
      
      if (ids.includes(parseInt(values[3]))) {
        dataObject[tableNames[0]] = trip[parseInt(values[0])];
        dataObject[tableNames[1]] = values[1];
        dataObject[tableNames[3]] = parseInt(values[3]);
        await docRef.set(dataObject);
        console.log(`Document ${i} added to Firestore successfully!`);
      }
    }

    console.log('File processed and data uploaded to Firestore!');
  } catch (error) {
    console.error('Error processing file or uploading data to Firestore:', error);
  }
};
processFile();

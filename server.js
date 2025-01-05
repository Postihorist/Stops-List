const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const geoip = require('geoip-lite');
const serviceAccount = require('./adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());
const PORT = 3000;

const db = admin.firestore();
let stopAreas = [];
//stopAreas = ["Narva", "Tartu"]; // Placeholder

async function getStopAreas() {
    const stopsCollection = await db.collection('stops').get();
    stopAreas = stopsCollection.docs.map((doc) => doc.data().stop_area);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/stop-areas', (req, res) => {
    res.json({ stopAreas });
});

app.get('/city', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    //var geo = geoip.lookup(ip).ll;
    var geo = [59.3772, 28.1903] // Placeholder
    var stopsCollection = await db.collection('stops').where("stop_lat", ">=", geo[0]).get();
    const pointList = stopsCollection.docs.map((doc) => [doc.data().stop_lat, doc.data().stop_lon])
    var closest = pointList.reduce((a, b) => distance(a, geo[0], geo[1]) < distance(b, geo[0], geo[1]) ? a : b);
    const closestStop = await db.collection('stops').where("stop_lat", "==", closest[0]).where("stop_lon", "==", closest[1]).get();
    closestStop.forEach(doc => {geo = doc.data().stop_area + ";" + doc.data().stop_name});
   
    res.send(geo);
});

function distance(p, lat, lon) {
    return Math.sqrt(Math.pow(lat - p[0], 2) + Math.pow(lon - p[1], 2))
}

let stopNames = [];  
//stopNames = ["Juurika;25643", "Nõmmela;162579"]; // Placeholder
app.post('/find-stops', async (req, res) => {
    const region = req.body.region;
    var stopsCollection = await db.collection('stops').where("stop_area", "==", region).get(); //Quota limited
    stopNames = stopsCollection.docs.map((doc) => doc.data().stop_name + ";" + doc.data().stop_id); //Quota limited
    console.log(`Received region: ${region}`);
    res.json({ stopNames });
});

getStopAreas(); //Quota limited

let stopTimes = [];  
//stopTimes = ["13:43:00;Tartu - Nõo - Tõravere - Nõo - Nõgiaru - Tartu", "13:28:00;Tartu - Nõgiaru - Nõo - Nõgiaru - Tartu"] // Placeholder
app.post('/find-times', async (req, res) => {
    const stops = parseInt(req.body.stops);
    var stopsCollection = await db.collection('times').where("stop_id", "==", stops).get(); //Quota limited
    stopTimes = stopsCollection.docs.map((doc) => doc.data().arrival_time + ";" + doc.data().trip_id); //Quota limited
    console.log(`Received stop: ${stops}`);
    res.json({ stopTimes });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const app = express();
const mongo = require("mongodb").MongoClient;
const dsn =  process.env.DBWEBB_DSN || "mongodb://localhost:27017/jhellberg";

const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.origins(['https://project.jhellberg.me:443']);

let c = {company: "Tillagade Pannkakor", value: 200, date: new Date()}
let cc = {company: "Brända Pannkakor", value: 20, date: new Date()}
let ccc = {company: "Gräddade Pannkakor", value: 420, date: new Date()}
await insertInCollection(dsn, "stock", {}, {}, c);
await insertInCollection(dsn, "stock", {}, {}, cc);
await insertInCollection(dsn, "stock", {}, {}, ccc);
let stock = [];

setInterval(async (request, response) => {
    let newValue = 0;
    stock = await findInCollection(dsn, "stock", {}, {}, 6);
    for(let i = 0; i < stock.length; i++) {
        const random = Math.floor(Math.random() * Math.floor(stock[i].value / 10));
        if ( Math.floor(Math.random() * Math.floor(2)) == 0) {
            newValue = stock[i].value + random;
        } else {
            newValue = stock[i].value - random;
        }
        let newInsert = {company: stock[i]._id, value: newValue, date: new Date()}
        await insertInCollection(dsn, "stock", {}, {}, newInsert);
    }
    console.log(stock)
}, 60 * 1000);

io.on('connection', (socket) => {
    setInterval(async (request, response) => {
        let res = await findmapCollection(dsn, "stock", {}, { _id: 0, company: 0, date: 0, value: 1}, 0);
        io.emit('getAllOnline', res);
    }, 60 * 1000);
});

async function findInCollection(dsn, colName, criteria, projection, limit) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.aggregate(
        [
           {$sort:
                { date:-1}
           },
           {$group:
                {
                    "_id": "$company",
                    "date": { "$first": "$date" },
                    "value": { "$first":'$value'},
                }
           }
        ]).toArray();

    await client.close();

    return res.reverse();
}

async function insertInCollection(dsn, colName, criteria, projection, insert) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.insertOne(insert);

    await client.close();
}

async function findmapCollection(dsn, colName, criteria, projection, limit, username) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.find(criteria, projection).limit(limit).toArray();
    let dre = [];

    await client.close();

    for(let i = 0; i < res.length; i++) {
        dre.push(res[i].value)
    }

    return res;
}


server.listen(8300);

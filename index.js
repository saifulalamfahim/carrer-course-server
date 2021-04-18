const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express()
const port = 4200
require("dotenv").config();
const ObjectId = require('mongodb').ObjectId;


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ysvcd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('Services'));
app.use(fileUpload());
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const servicesCollection = client.db("careerCourse").collection("Services");
    const userServicesCollection = client.db("careerCourse").collection("userServices");
    const reviewCollection = client.db("careerCourse").collection("Review");
    const adminCollection = client.db("careerCourse").collection("admin");
    const statusCollection = client.db("careerCourse").collection("status");

    
    app.post("/addService", (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const desc = req.body.desc;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        servicesCollection.insertOne({ name, desc, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    
    app.get('/Services', (req, res) => {
        servicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post("/addAdmin", (req, res) => {
        const email = req.body.email;
        adminCollection.insertOne({ email })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    
    app.post("/addOrder", (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const desc = req.body.desc;
        const email = req.body.email;
        const service = req.body.service;
        const price = req.body.price;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        userServicesCollection.insertOne({ name, desc, email, service, price, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    
    app.get('/allOrders', (req, res) => {
        userServicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })


    
    app.post("/review", (req, res) => {
        const name = req.body.name;
        const desig = req.body.desig;
        const desc = req.body.desc;
        const photo = req.body.photo;
        reviewCollection.insertOne({ name, desig, desc, photo })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // Get Review Collection
    app.get('/getReview', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // Status
    app.patch("/addStatus/:id", (req, res) => {
        const status = req.body.status;
        userServicesCollection.updateOne(
            { _id: ObjectId(req.params.id) },
            { $set: { status } }
            )
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    // Finding Admin
    app.get('/findAdmin/:email', (req, res) => {
        adminCollection.find({email: req.params.email})
            .toArray((err, documents) => {
                res.send(documents.length > 0);
            })
    })

    
    const admin = require('firebase-admin');
    var serviceAccount = require("./configs/earn-2018-firebase-adminsdk-7kbrn-e239f4c90e.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIRE_DB
    });

    app.get("/orders", (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {

            const idToken = bearer.split(' ')[1];

           
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    let uid = decodedToken.uid;
                   

                    
                    if (tokenEmail == queryEmail) {
                        userServicesCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized access!!")
                    }
                })
                .catch(function (error) {
                    res.status(401).send("Unauthorized access!!")
                });
        }

        else {
            res.status(401).send("Unauthorized access!!")
        }
    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)
//importing
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";


//app config
dotenv.config();
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
    appId: '1084307',
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: 'ap2',
    encrypted: true
  });
  

// middleware
app.use(express.json());  
app.use(cors());



//DB config
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.once("open", () => {
    console.log("db connection succesfull...");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    changeStream.on("change", (change) => {
        console.log(change);
        if(change.operationType == "insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted",{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
        
            } ) 
        }
        else {
            console.log("Error triggering pusher...");
        }
       
    })
})


//api routes
app.get("/",(req,res) => res.status(200).send("hello world"));
app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.send(err)
        } else {
            res.send(data)
        }
    })
})

app.post("/messages/new", (req, res) => {

    const dbMesssage = req.body;
    Messages.create(dbMesssage,(err, data) => {
        if(err){
            res.status(500).send(err)

        } else {
            res.status(201).send(data);

        }
    })
})

//listener
app.listen(port, () => console.log(`Server is Listening on Localhost ${port}`));
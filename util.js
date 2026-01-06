require('dotenv').config();
const {MongoClient,ServerApiVersion}=require('mongodb');
require("@tensorflow/tfjs-node")
const us_encoder=require("@tensorflow-models/universal-sentence-encoder")
const {MONGO_HOST,MONGO_PORT,MONGO_USER,MONGO_PASS,MONGO_DB,MONGO_COLLECTION}=process.env
const uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}/?retryWrites=true&w=majority`;

let client;
let model;
async function loadModel(){
    if (!model){
        model=await us_encoder.load();
    }
}
async function vectorizeText(t){
    await loadModel();
    const embeddingsReq=await model.embed(t);
    const v=embeddingsReq.arraySync()[0]
    return v;
}
async function connectMongo(){
    if (!client){
        client=new MongoClient(uri);
        try {
            await client.connect();
            console.log('conn');
        } catch (err){
            console.err('err',err);
            throw err;
        }
    }
    return client.db(MONGO_DB);
}

async function closeConn(){
    if(client){
        await client.close();
        console.log('Closed');
        client=null;
    }
}

module.exports={vectorizeText,connectMongo,closeConn,MONGO_COLLECTION}
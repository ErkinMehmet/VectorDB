const { Collection } = require('mongodb');
const newsArray=require('./data/newsData.json');
const {vectorizeText,connectMongo,closeConn,MONGO_COLLECTION} =require('./util')
// create vector embeddings and load the data
async function loadVectorizedData(){
    const db=await connectMongo();
    const collection=db.collection(MONGO_COLLECTION);
    try 
    {
        console.log(newsArray.length.toString());
        for (const newsItem of newsArray){
            const text=newsItem.short_description;
            const description_v=await vectorizeText(text);
            if (description_v && description_v.length>0){
                await collection.insertOne({
                    link: newsItem.link,
                    headline: newsItem.headline,
                    category: newsItem.category,
                    short_description: newsItem.short_description,
                    authors: newsItem.authors,
                    date: newsItem.date,
                    description_vector: description_v
                });
                console.log('Vectorized data stored in MongoDB Atlas for:', newsItem.headline);
            } else {
                console.log('No vectors were generated for:', newsItem.headline);
            }
        }
    } catch (error) {
            console.error('Error during data loading:', error);
    } finally {
        await closeConn();
    }
}
loadVectorizedData();

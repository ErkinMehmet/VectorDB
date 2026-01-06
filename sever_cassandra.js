const express=require('express');
const {vectorizeText,conn,closeConn,CASSANDRA_KEYSPACE,CASSANDRA_TABLE} =require('./util_cassandra');
const app=express();
app.use(express.json())
app.post('/search',async(req,res)=>{
    const t=req.body.text;
    if (!t){
        return res.status(400).send({error:'text is req'});
    }
    try {
        const db=await conn();
        // create vecto5rize the db using the utility code
        const queryVector=await vectorizeText(t);
        // create the query for the database using the embedding column to search using the cosine similarity.
        // we are ordering by similarity and only asking for the first three results.
        const query = `SELECT title, similarity_cosine(embedding,  [${queryVector}]) as similarity FROM ${CASSANDRA_KEYSPACE}.${CASSANDRA_TABLE} ORDER BY embedding ANN OF [${queryVector}] LIMIT 3`;
        const result = await client.execute(query);
        if (result.rowLength > 0) {
            // map through all rows to construct a response array
            const matches = result.rows.map(row => ({
                title: row['title'],
                similarity: row['similarity']
            }));
            // return HTTP OK with the matches.
            res.status(200).send(matches);
        } else {
            // return 200 with message saying nothing was found.
            res.status(200).send({ message: 'No similar sentences found.' });
        }
    } catch(e){
      console.error('Error', e);
        res.status(500).send({ e: 'Internal server error' });
    } finally {
        await closeConn();
    }
});

const PORT=process.env.PORT|| 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
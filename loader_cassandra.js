const fs=require('fs');
const csv=require('csv-parser');
const {conn,ensureKeyspaceAndTable,vectorizeText,closeConn,TimeUuid,
    CASSANDRA_KEYSPACE,CASSANDRA_TABLE} =require('./util_cassandra');
const { on } = require('cluster');

async function loadVectorizedData(){
    const client=await conn();
    await ensureKeyspaceAndTable();
    const ops=[];
    const dataStream=fs.createReadStream('./data/songs.csv')
        .pipe(csv())
        .on('data',(row)=>{
            dataStream.pause();
            const op=async() =>{
                try {
                    const sentence=row['Title'];
                    const embed=await vectorizeText(sentence);
                    const query = `INSERT INTO ${CASSANDRA_KEYSPACE}.${CASSANDRA_TABLE} (id, artist, downloads, embedding, radio_plays, rating, sales, streams, title, year)
                    VALUES (${TimeUuid.now()}, '${row['Artist']}', ${parseFloat(row['Downloads'])}, [${embedding}], ${parseFloat(row['Radio Plays'])}, ${parseFloat(row['Rating'])}, ${parseFloat(row['Sales'])}, ${parseFloat(row['Streams'])}, '${sentence}', ${parseInt(row['Year'])});`;
                    await client.execute(query);
                    console.log(`Inserted sentence: ${sentence}`);
                } catch (error) {
                    console.error('Error inserting data:', error);
                } finally {
                    dataStream.resume();
                }
            };
            ops.push(op);
        })
        .on('end',async()=>{
            await Promise.all(ops)
            await closeConn();
        });
    dataStream.read();
}
loadVectorizedData();
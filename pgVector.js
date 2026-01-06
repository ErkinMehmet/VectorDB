const pg=require('pg');
// Configuration object for PostgreSQL connection
const config = {
  host: 'localhost',       // Database host
  database: 'postgres',    // Database name
  user: 'postgres',        // Database user
  password: 'password',  //Replace this with the password of your PostgreSQL instance
  port: 5432               // Database port
}

// Array of sentences to **be inserted** into the database
let sentences = [
  "The horse is galloping",
  "The owl is hooting",
  "The rabbit is hopping",
  "The koala is munching",
  "The penguin is waddling",
  "The kangaroo is hopping",
  "The fox is prowling",
  "The parrot is squawking",
  "The turtle is crawling",
  "The cheetah is sprinting"
]

const client=new pg.Client(config);
const addData=async()=>{
    // SQL query to Create a table if it doesn't already exist
    // 'sentence' is column to store the sentence as a tsvector for full-text search
    // actual_sentence is column to store the actual sentence as text
    const createTableQuery = `
          CREATE TABLE IF NOT EXISTS mysentences (
            id SERIAL PRIMARY KEY,
            sentence tsvector,
            actual_sentence TEXT
          )`;
    // Execute the query to create the table
    await client.query(createTableQuery);
    console.log('Table created successfully');
    // Loop through the sentences array and insert each sentence into the table
    for (const sentence of sentences) {
        await client.query('INSERT INTO mysentences (sentence, actual_sentence) VALUES ($1, $2)', [sentence, sentence]);
    }
    // Query to select all rows from the table
    const { rows } = await client.query("SELECT * FROM mysentences");
    // Loop through the result rows and print each sentence
    for (let row of rows) {
        console.log(row.actual_sentence + "   " + row.sentence);
    }
}

// Function to retrieve data based on a full-text search query
const getData = async (str_query) => {
    console.log('Connected to PostgreSQL database');
    // Execute a full-text search query on the 'mysentences' table
    const { rows } = await client.query("SELECT actual_sentence FROM mysentences WHERE sentence @@ to_tsquery('english', $1)", [str_query]);
    // Loop through the result rows and print each matching sentence
    for (let row of rows) {
        console.log(row.actual_sentence);
    }
}

// Main function to connect to the database, add data, and retrieve data
const main = async () => {
    // Connect to the PostgreSQL database
    await client.connect();
    // Insert data
    await addData();
    //Retrieve data
    await getData("penguin");
}
// Execute the main function and exit the process when done
main().then(() => {
    process.exit();
});

// vectorize

const padArray=(array)=>{
    const leng=100;
    if (array.length>=leng){
        return array.slice(0,leng);
    } else {
        const padding=Array(leng-array.length).fill(0);
        return array.concat(padding);
    }
}

const vectorize=(s)=>{
    const charToInt=(char)=>char.charCodeAt(0);
    return padArray(s.split('').map(charToInt));
}
client.connect()
.then.apply(async()=>{
     console.log('Connected to PostgreSQL database');
    // SQL query to Create a table
    const createTableQuery = `
          CREATE TABLE IF NOT EXISTS mynewsentences (
            id SERIAL PRIMARY KEY,
            sentence TEXT,
            embedding INTEGER[]
          )`;
    // Execute the query to create the table
    await client.query(createTableQuery);
    console.log('Table created successfully');
    for (const s of sentences){
        const embeddings=vectorize(s);
        await client.query('INSERT INTO mynewsentences (sentence, embedding) VALUES ($1, $2)', [sentence, embeddings])
    }
    const { rows } = await client.query(`SELECT * FROM mynewsentences`)
      for (let row of rows) {
          console.log(row.sentence);
      }
      process.exit(); // Exit the Node.js process
}) .catch(err => console.error('Error connecting to PostgreSQL database', err));

// query
//Check Euclidean distance
const checkDistance = (v1,v2)=>{
    let sumOfSquares = 0;
    for (let i = 0; i < v1.length; i++) {
        const difference = v1[i] - v2[i];
        sumOfSquares += difference * difference;
    }
    return Math.sqrt(sumOfSquares);
}

const search_a_match=async(q)=>{
    const newvec=vectorize(q);
    await client.connect();
    const { rows } = await client.query(`SELECT * FROM mynewsentences`)
  for (let row of rows) {
    console.log(row.sentence);
    console.log(checkDistance(row.embedding, newvec))
  }
    return;
}

search_a_match("What is the horse doing??").then(()=>{
    console.log("Done");
    process.exit();
})


//Calculate Cosine similarity
const checkSimilarity = (v1,v2)=>{
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        normA += v1[i] ** 2;
        normB += v2[i] ** 2;
    }
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return similarity;
}

const create_table = async () => {
      // SQL query to Create a table
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mysentences_tf (
              id SERIAL PRIMARY KEY,
              sentence TEXT,
              embedding FLOAT[]
            )`;
      // Execute the query to create the table
      await client.query(createTableQuery);
      console.log('Table created successfully');
      return;
}
const insert_data = async(model)=>{
  for (const sentence of sentences) {
    const embeddings = await vectorize(model, sentence);
    await client.query('INSERT INTO mysentences_tf (sentence, embedding) VALUES ($1, $2)', [sentence, embeddings])
  }
}

// Connect and search the table
const search_a_match = async (model, querystr)=>{
  const newvec = await vectorize(model, querystr);
  const { rows } = await client.query(`SELECT * FROM mysentences_tf`)
  const match_dist = {};
  for (let row of rows) {
    match_dist[row.sentence] = checkSimilarity(row.embedding, newvec);
  }
  // Convert the object into an array of key-value pairs
  const arr = Object.entries(match_dist);
  // Sort the array based on the values
  arr.sort((a, b) => b[1] - a[1]);
  return arr[0][0];
}
await client.connect();
console.log('Connected to PostgreSQL database');
const model = await us_encoder.load();
console.log("Model loaded successfully");
await create_table();
await insert_data(model);
const result = await search_a_match(model, "What does the parrot do?")
console.log(`The closest match is "${result}"`);
process.exit();

const { ChromaClient } = require('chromadb');  // Imports the ChromaClient class from the chromadb library
const client = new ChromaClient();             // Creates a new ChromaClient instance

async function main(){
    try {
        const collection=await client.getOrCreateCollection({
            name:"my_collection"
        })
        const texts = [
            "This is sample text 1.", // First text item in the array
            "This is sample text 2.", // Second text item in the array
            "This is sample text 3." // Third text item in the array
        ];
        // generate the uniq identifiers
        const ids=texts.map((_,index)=>`document_${index+1}`)
        await collection.add({ids:ids,documents:texts})
        const allItems=await collection.get();
        console.log(allItems);    
        } catch(e) {
        console.error("Err:",e);
    }
}

main()
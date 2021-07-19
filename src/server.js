import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
const app=express();

// const articlesinfo={
//     'learn-react':{
//         upvotes:0,
//         comments:[],
//     },
//     'node':{
//         upvotes:0,
//         comments:[],
//     },
//     'doge':{
//         upvotes:0,
//         comments:[],
//     }
// }
app.use(express.static(path.join(__dirname, '/build')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const withDB = async (operations, res) => {
    try{

        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser:true});
        const db=client.db('my-blog');

        await operations(db);

        client.close();
    } catch(error){
        res.status(500).json({ message: "Error connecting to DB", error});
    }
}

// app.get('/hello', (req, res) => res.send('Hello!'));
// app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));
// app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}!`));

app.get('/api/articles/:name', async (req,res) => {
    withDB(async (db)=> {

        const articleName =req.params.name;

        const articlesinfo = await db.collection('articles').findOne({ name : articleName});
        res.status(200).json(articlesinfo);

    }, res);
})

// app.post('/api/articles/:name/upvote', (req,res) =>{
//     const articleName =req.params.name;
    
//     articlesinfo[articleName].upvotes += 1;

//     res.status(200).send(`${articleName} now has ${articlesinfo[articleName].upvotes} upvotes.`)
// });

// app.post('/api/articles/:name/add-comment', (req,res) =>{
//     const{username,comment} = req.body;
//     const articleName = req.params.name;

//     articlesinfo[articleName].comments.push({username,comment});
//     res.status(200).send(articlesinfo[articleName]);
// });

app.post('/api/articles/:name/upvote', async (req,res) =>{
        
    withDB( async(db) => {
        const articleName =req.params.name;

    const articlesinfo = await db.collection('articles').findOne({ name: articleName});
    await db.collection('articles').updateOne({name:articleName}, {
        '$set':{
            upvotes: articlesinfo.upvotes + 1,
        },

    });
    const updatedArticleInfo =  await db.collection('articles').findOne({ name: articleName});

    res.status(200).json(updatedArticleInfo);
    }, res)
});

app.post('/api/articles/:name/add-comment', (req,res) =>{
    const{username,comment} = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articlesinfo = await db.collection('articles').findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName},{
            '$set':{
                comments: articlesinfo.comments.concat({username, comment})
            }
        });

        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName});

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log("Listening on port 8000"));
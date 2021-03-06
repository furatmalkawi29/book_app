'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override'); //-----------------middleware
// npm i method-override //------- Note: always install when require , before use();

// Application Setups
const PORT = process.env.PORT || 3030;
const server = express();
// set ejs templeting engine
server.use(express.static('./public'));
server.set('view engine','ejs'); // npm i ejs //----------lab01

//NOTE:: ----------------
// node.js middleware ,to take data from Form Data to request body
server.use(express.urlencoded({extended:true})); //----------lab01

// we can change name from _method to anything : _method33343
server.use(methodOverride('_method')); //-----------------middleware

// Database Setup
// to run locally:
// const client = new pg.Client(process.env.DATABASE_URL); //-------------lab03

//to run on herokuu:
const client = new pg.Client( { connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); 


//routs ---------------------------------
server.get('/hello', testHandler);
server.get('/', homeRoutHandler);
server.get('/searches/new', newRoutHandler);
server.post('/searches', showRoutHandler);
server.get('/books/:id', detailsHandler);
server.post('/books', addBookHandler);
server.delete('/deleteBook/:id', deleteBookHandler);
server.put('/updateBook/:id', updateBookHandler);
server.get('*', noRoutHandler);

//functions -------------------------------
//home page to --> form page
function newRoutHandler (req,res) {

  res.render('pages/searches/new');
  //NOTE:: ----------------
  //add all path parts exept: views/
  // dont add file ext
}

//----------------------------

function deleteBookHandler (req,res)
{
  let SQL = `DELETE FROM bookshelf WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value)
    .then(res.redirect('/'));
}

//-------------------

function updateBookHandler (req,res)
{
  let {author,title,isbn,image_url,description} = req.body;
  let SQL = `UPDATE bookshelf SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5 WHERE id=$6;`;
  let safeValues = [author,title,isbn,image_url,description,req.params.id];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/books/${req.params.id}`);
    });
}

//--------------------------
//form page to --> render page
function showRoutHandler (req,res){
  // https://www.googleapis.com/books/v1/volumes?q=cat

  //NOTE:: ----------------
  //No need for key
  //one required parameter: q
  // q takes keywords
  // keywords: author, title , publisher
  // example --> title : intitle
  // q=intitle:cat
  // q=inauthor:james

  let searchTerm = req.body.book;
  let choice = req.body.choice;
  // console.log(req.body);
  let bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=${choice}:${searchTerm}`;

  superagent.get(bookAuthorURL)
    .then(fullBookData => {

      let bookData = fullBookData.body.items;
      //console.log(bookData);

      let bookObjArr = bookData.map(item => {

        return new Book (item); });

      // res.send(bookObjArr);// for testing
      // res.send(fullBookData.body.items);
      res.render('pages/searches/show',{renderBookData:bookObjArr} );
    }).catch(()=>{
      //NOTE:: ----------------
      // if error catched in search render page :
      res.render('pages/error',{bookSearch:searchTerm} );
    });
}

//----------------------------
function testHandler (req,res){
  res.render('pages/index');
}

//-----------------------

function homeRoutHandler (req,res) {

  //in book.sql lAT PROPERTY IN TABLE shoudnt have comma (,)

  let SQL = `SELECT * FROM bookshelf;`;
  client.query(SQL)
    .then (shelfData=>{

      let bookCount = shelfData.rows.length;
      // res.send(shelfData.rows);
      res.render('pages/index',{books: shelfData.rows, count:bookCount});
    })
    .catch(err=>{
      res.send(err);
    });
  // res.render('pages/index');

}


//----------------------------------

function detailsHandler(req,res)
{
  console.log('params');
  console.log(req.params);
  let SQL = `SELECT * FROM bookshelf WHERE id=$1;`;
  let safeValue = [req.params.id];
  client.query(SQL,safeValue)
    .then(result=>{
      console.log(result.rows);
      res.render('pages/books/detail',{bookDetail:result.rows[0]});
      // res.send(result.rows[0]);
    });
}


//-------------------------
function addBookHandler (req,res)
{
  console.log(req.body);
  let {author,title,isbn,image_url,description} = req.body;
  let SQL = `INSERT INTO bookshelf (author,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
  // let safeValues = [req.body.title,req.body.description,req.body.contact,req.body.status,req.body.category];
  let safeValues = [author,title,isbn,image_url,description];
  client.query(SQL,safeValues)
    .then(result=>{
      console.log(result.rows);
      // res.send(result.rows);
      res.redirect(`/books/${result.rows[0].id}`);
    });
}
// constructor----------------------------

function Book (oneBook)
{
  //NOTE:: ----------------
  //if there's issues with api data --> give this data insttead

  this.title = oneBook.volumeInfo.title ? oneBook.volumeInfo.title : 'Unkonown',
  this.author = oneBook.volumeInfo.authors? oneBook.volumeInfo.authors : 'Unkonown', // array
  this.description = oneBook.volumeInfo.description ? oneBook.volumeInfo.description : 'Unkonown' ,
  this.imgUrl = oneBook.volumeInfo.imageLinks? oneBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';

  //-----------------ISBN :
  let regEx = /ISBN/g;

  this.isbn= regEx.test(oneBook.volumeInfo.industryIdentifiers[0].type)? oneBook.volumeInfo.industryIdentifiers[0].identifier : 'unknown';

  console.log(this.isbn);

  //NOTE:: ----------------
  // terminal : Cannot read property 'thumbnail' of undefined
  // if oneBook.volumeInfo.imageLinks --> undefined
  //--> you cant access thumbnail

}
//----------------------------
function noRoutHandler (req,res){
  res.send('not found rout');
}



client.connect() //--------------------lab03
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on ${PORT}`));

  }).catch(error=>{
    console.log(error);
  });

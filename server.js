'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');


// Application Setups
const PORT = process.env.PORT || 3030;
const server = express();
// set ejs templeting engine
server.use(express.static('./public'));
server.set('view engine','ejs'); // npm i ejs //----------lab01

//NOTE:: ----------------
// node.js middleware ,to take data from Form Data to request body
server.use(express.urlencoded({extended:true})); //----------lab01

//routs ---------------------------------
server.get('/hello', testHandler);
server.get('/', homeRoutHandler);
server.get('/searches/new', newRoutHandler);
server.post('/searches', showRoutHandler);
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
  let bookAuthorURL;
  // console.log(req.body);

  if (req.body.title === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTerm}`;
  } else if (req.body.author === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${searchTerm}`;
  }

  superagent.get(bookAuthorURL)
    .then(fullBookData => {

      let bookData = fullBookData.body.items;
      //console.log(bookData);

      let bookObjArr = bookData.map(item => {

        return new Book (item); });

      // res.send(bookObjArr);// for testing

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
  // res.send('home route');
  res.render('pages/index');
}

// constructor----------------------------

function Book (oneBook)
{
  //NOTE:: ----------------
  //if there's issues with api data --> give this data insttead

  this.title = oneBook.volumeInfo.title ? oneBook.volumeInfo.title : 'Unkonown',
  this.authors = oneBook.volumeInfo.authors? oneBook.volumeInfo.authors : 'Unkonown', // array
  this.description = oneBook.volumeInfo.description ? oneBook.volumeInfo.description : 'Unkonown' ,
  this.imgUrl = oneBook.volumeInfo.imageLinks? oneBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';

  //NOTE:: ----------------
  // terminal : Cannot read property 'thumbnail' of undefined
  // if oneBook.volumeInfo.imageLinks --> undefined
  //--> you cant access thumbnail

}
//----------------------------
function noRoutHandler (req,res){
  res.send('not found rout');
}



server.listen(PORT,()=>{
  console.log(`Listening on PORT ${PORT}`);
});

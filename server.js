const express = require("express");
const exphbs = require('express-handlebars');
var mongoose = require("mongoose");
var path = require('path');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(express.urlencoded({ extended: true }));
// Parse request body as JSON
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set('index', __dirname + '/views');


// Hook mongoose configuration to the db variable
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


//ROUTES

// A GET route for scraping the echoJS website
app.get("/", function (req, res) {
  db.Article.find({ saved: false }, function (err, result) {
      if (err) throw err;
      res.render("index", {result})
  })
});

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.echojs.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        result.summary = $(this)
          .children("a")
          .text();

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});


app.get("/articles", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
      res.json(dbArticle);
  })
  .catch(function(err) {
      res.json(err);
  });
});


// get article by ObjectId
app.get('/articles/:id', function(req, res) {
  db.Article.findOne({ _id: req.params.id })
  .then(function(dbArticle) {
      res.json(dbArticle);
  })
  .catch(function(err) {
      res.json(err);
  });
});


// Save Article
app.post('/save/:id', function(req, res) {
  db.Article.findByIdAndUpdate(req.params.id, {
      $set: { saved: true}
      },
      { new: true },
      function(error, result) {
          if (error) {
              console.log(error);
          } else {
              res.redirect('/');
          }
      });
});



// get saved articles
app.get("/saved", function (req, res) {
  var savedArticles = [];
  db.Article.find({ saved: true }, function (err, saved) {
      if (err) throw err;
      savedArticles.push(saved)
      res.render("saved", { saved })
  })
});


// delete Article
app.post('/delete/:id', function(req, res) {
  db.Article.findByIdAndUpdate(req.params.id, {
      $set: { saved: false}
      },
      { new: true },
      function(error, result) {
          if (error) {
              console.log(error);
          } else {
              res.redirect('/saved');
          }
      });
});



// Server Listening
app.listen(PORT, function() {
    console.log("App running on port " + PORT);
  });
const express = require("express");
const exphbs = require('express-handlebars');
var mongoose = require("mongoose");
var path = require('path');


var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var app = express();

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set('index', __dirname + '/views');


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


//ROUTES

app.get("/", function (req, res) {
  db.Article.find({ saved: false }, function (err, result) {
      if (err) throw err;
      res.render("index", {result})
  })
});

app.get("/scrape", function(req, res) {
  axios.get("http://www.echojs.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("article h2").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        result.summary = $(this)
          .children("a")
          .text();

      // Create a new Article from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

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
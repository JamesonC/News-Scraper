var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Hook mongoose configuration to the db variable
var DB_URI = process.env.MONGODB_URI || "mongodb://localhost/News-Scraper";

mongoose.connect(DB_URI, {
  useNewUrlParser: true
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/json", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.Article.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios
    .get("https://www.makeuseof.com/service/programming/")
    .then(function(response) {
      // Load the html body from axios into cheerio
      var $ = cheerio.load(response.data);
      // For each element with a "h1" tag
      $("h1").each(function(i, element) {
        var result = {};

        result.title = $(this).text();
        result.link = $(this)
          .children("a")
          .attr("href");

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

      // Send a "Scrape Complete" message to the browser
      res.send("Scrape Complete");
    });
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});

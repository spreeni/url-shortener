// server.js
// where your node app starts

// init project
const express = require('express')
const app = express()
var mongo = require('mongodb').MongoClient;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.
app.use(express.static('public'))


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

app.get("/:id", (req, res) => {
  // Checks if the ID exists in the database and if it is redirects to the original URL.
  var url = 'mongodb://' + process.env.DBadmin + ':' + process.env.DBpw + '@ds041404.mlab.com:41404/url-shorten'
  var id = req.params.id
  
  mongo.connect(url, function(err, client) {
    if (err) {
      res.send('There was an error connecting to the database.')
      console.log('There was an error connecting to the database.')
    } else {
      var db = client.db('url-shorten')
      var collection = db.collection('urls')
      collection.find(
        { id: +id}
      ).toArray(function(err,docs) {
        if (err) {
          console.log('There was an error in the find function.')
          res.send('There was an error in the find function.')
          client.close()
        } else {
          console.log(docs)
          if (docs.length==0) res.send({"error": "This ID doesn't exist yet in the database."})
          else if (docs.length>1) res.send({"error": "There are multiple items with this ID in the database."})
          else { 
            var newURL = docs[0].url
            if ((docs[0].url.indexOf('https://')==-1) && (docs[0].url.indexOf('http://')==-1)) newURL='https://' + newURL
            res.redirect(newURL) 
          }
        }    
        client.close()
      })      
    }
  }) 
})

app.get("/new/:urlReq*", (req, res) => {
  // Checks if the url is valid. If it is, it inserts it into the database and returns a JSON object containing the original and shortened url.
  var url = 'mongodb://' + process.env.DBadmin + ':' + process.env.DBpw + '@ds041404.mlab.com:41404/url-shorten'
  var urlReq = req.url.slice(5)
  if (validateURL(urlReq)==false)  res.send({"error": "invalid URL"})
  else {
    mongo.connect(url, function(err1, client) {
      if (err1) {
        res.send('There was an error connecting to the database.')
        console.log('There was an error connecting to the database.')
      } else {
        var db = client.db('url-shorten')
        var collection = db.collection('urls')
        collection.find(
          { url: urlReq}
        ).toArray(function(err2,docs) {
          if (err2) {
            console.log('There was an error in the find function.')
            res.send({"error": 'There was an error in the find function.'})
            client.close()
          } else {
            if (docs.length==1) {
              res.send({"original_url": urlReq, "shortened_url": 'https://icy-detail.glitch.me/' + docs[0].id})
            } else if (docs.length>1) {
              res.send("There are " + docs.length + " items with this URL in the database. They belong to the following IDs: " + docs[0].id + ", " + docs[1].id)
              client.close()
            } else {
              // Searches for the length of the database to find the next index.
              collection.find ({}).toArray(function(err3,entries) {
                if (err3) {
                  console.log('There was an error in the find function for the findAllEntries.')
                  res.send({"error": 'There was an error in the findAllEntries function.'})
                  client.close()
                } else {
                  var objInsert = {"id": entries.length+1, "url": urlReq}
                  collection.insert(objInsert, function(err4, result) {
                    if (err4) {
                      console.log('There was an error inserting the url into the database.')
                      res.send({"error": 'There was an error inserting the url into the database.'})
                      client.close()
                    } else {
                      res.send({"original_url": urlReq, "shortened_url": 'https://icy-detail.glitch.me/' + objInsert.id})
                      client.close()
                    }
                  })
                }
              })
            }
          }
        })
      }
    }) 
  }
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})


function validateURL(url) {
    // Checks to see if it is an actual url
    // Regex from https://gist.github.com/dperini/729294
    var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    return regex.test(url)
}
// server.js
// where your node app starts

// init project
const express = require('express')
const app = express()
var mongo = require('mongodb').MongoClient;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))

// http://expressjs.com/en/starter/basic-routing.html
app.get("", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

app.get("/:id", (req, res) => {
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
          if (docs.length==0) res.send("This ID doesn't exist yet in the database.")
          else if (docs.length>1) res.send("There are " + docs.length + " items with the ID " + id + "in the database. They belong to the following URLs: " + docs[0].url + ", " + docs[1].url)
          else { 
            res.redirect(301, 'www.spicy.com') 
          }
          client.close()
        }
      })
    }
  }) 
})

app.get("/new/:urlReq", (req, res) => {
  var url = 'mongodb://' + process.env.DBadmin + ':' + process.env.DBpw + '@ds041404.mlab.com:41404/url-shorten'
  var urlReq = req.params.urlReq
  //if (ValidURL(urlReq)==false)  res.send('"' + urlReq + '" is not a valid URL.')
  //else {
    //res.send('I am stupid and think that "' + urlReq + '" is a valid URL.')
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
            res.send('There was an error in the find function.')
            client.close()
          } else {
            if (docs.length==1) {
              res.send("This URL already is in the database under the ID " + docs[0].id + ".")
              client.close()
            } else if (docs.length>1) {
              res.send("There are " + docs.length + " items with this URL in the database. They belong to the following IDs: " + docs[0].id + ", " + docs[1].id)
              client.close()
            } else {
              //res.send("This URL is not yet in the database.")
              collection.find ({}).toArray(function(err3,entries) {
                if (err3) {
                  console.log('There was an error in the find function for the findAllEntries.')
                  res.send('There was an error in the findAllEntries.')
                  client.close()
                } else {
                  var objInsert = {"id": entries.length+1, "url": urlReq}
                  collection.insert(objInsert, function(err4, result) {
                    if (err4) {
                      console.log('There was an error inserting the url into the database.')
                      res.send('There was an error inserting the url into the database.')
                      client.close()
                    } else {
                      res.send('Insertion into the database complete.<br>Here is your new URL: <a href="https://icy-detail.glitch.me/' + objInsert.id + '">https://icy-detail.glitch.me/' + objInsert.id + '</a>')
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
  //}
})

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})


function isValidURL(urlString)
{
    try
    {
        var url = new URL(urlString);
        url.toURI();
        return true;
    } catch (exception)
    {
        return false;
    }
}

function ValidURL(str) {
  var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
    '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
    '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
    '(\:\d+)?(\/[-a-z\d%_.~+]*)*'+ // port and path
    '(\?[;&a-z\d%_.~+=-]*)?'+ // query string
    '(\#[-a-z\d_]*)?$','i'); // fragment locater
  if(!pattern.test(str)) {
    alert("Please enter a valid URL.");
    return false;
  } else {
    return true;
  }
}
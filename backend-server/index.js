var express = require('express');

var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
var URL = require('url-parse');

var mongoUri = process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/nodemongoexample';

var MongoClient = require('mongodb').MongoClient, format = require('util').format;

var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

vehicles_names = ['JANET','ilFrXqLz', 't4wcLoCT', 'WnVPdTjF', '1fH5MXna', '4aTtB30R', '8CXROgIF', 'w8XMS577', 'ZywrOTLJ', 'cQRzspF5',
			      'GSXHB9L1', 'TztAkR2g', 'aSOqNo4S', 'ImjNJW4n', 'svEQIneI', 'N10SCqi5', 'QQjjwwH2', 'H0pfmYGr', 'FyUHoAvS', 'bgULOMsX',
			      'OlOBzZF8', 'Ln7b7ODx', 'ZoxN11Sa', 'itShXf78', 'o6kJKzyI', 'pD0kGOax', 'njr1i7xM', 'wtDRzig8', 'l2r8bViT', 'oZn3b2OZ',
			      'ym2J1vil'];

app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response){
 	response.set('Content-Type', 'text/html');
	var indexPage = '';

	db.collection('passengers', function(er, collection) {

		collection.find().toArray(function(err, results) {

			if (!err) {
				results.sort(function(a, b) {
    				return (b.created_at) - (a.created_at);
				});
				indexPage += "<!DOCTYPE HTML><html><head><title>Database Info</title></head><body>";
				for (var i = 0; i < results.length; i++) {
					indexPage += "<p>"+results[i].username + " requested a vehicle at " + results[i].lat + ", " + results[i].lng + " on " + results[i].created_at+"</p>";
				}
				indexPage += "</body></html>"
				response.send(indexPage);
			} else {
				response.send('<!DOCTYPE HTML><html><head><title>Database Info</title></head><body><h1>Whoops, something went terribly wrong!</h1></body></html>');
			}
		});
	});
});


app.get('/vehicle.json', function(request, response){
 	response.set('Content-Type', 'application/json');

 	//var url = new URL(request.url);

 	var queryObject = URL(request.url,true).query;

 	var is_driver = false;
 	var username = queryObject.username;
 	if (username === undefined || username === "") {
 		response.send(JSON.stringify({}));
 	}

 	for (var index = 0; index < vehicles_names.length; index++) {
		if (username == vehicles_names[index]) {
			is_driver = true;
			break;
		}
	}

	if (!is_driver) {
		response.send(JSON.stringify({}));
	} 
	else {

		db.collection('vehicles', function(er, collection) {
			collection.findOne({"username" : username}, function(err, result) {
				if (!err) {
					response.send(result);
				}
			});
		});
	}
});

app.post('/submit', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	//console.log(req.body.username);
	// res.send(JSON.stringify({"vehicles":[],"passengers":[]}));

	if (req.body.username === undefined || req.body.lat === undefined || req.body.lng === undefined) {
		res.send(JSON.stringify({"error":"Whoops, something is wrong with your data!"}));
	} else { 

		var is_driver = false;

		var username = req.body.username;
	
		var lat = req.body.lat;
		lat = parseFloat(lat);

		var lng = req.body.lng;
  		lng = parseFloat(lng);


		for (var index = 0; index < vehicles_names.length; index++) {
			if (username == vehicles_names[index]) {
				is_driver = true;
				break;
			}
		}

		var time_stamp = new Date();

		if (is_driver == true) {
			db.collection('vehicles', function(error, coll) {
				coll.find().toArray(function(error, result) {
					var found = false;
					if (!error) {
						for (var i = 0; i < result.length; i++) {
							if (result[i].username == username) {
								found = true;
							}
						}
					}
					if (found) {
						toinsert = {
							"username": username,
							"lat": lat,
							"lng": lng,
							"created_at": time_stamp,
						};
						coll.update({"username" : username},toinsert);
					}
					else {
						toinsert = {
							"username": username,
							"lat": lat,
							"lng": lng,
							"created_at": time_stamp,
						};
						coll.insert(toinsert, function(error, saved){
						});
					}
					var fiveMinutesAgo = new Date(new Date().getTime() - 1000 * 60 * 5);
					db.collection('passengers', function(error, coll_pass) {
						coll_pass.find({"created_at" : {$gt : fiveMinutesAgo}}).toArray(function(error1, result_pass) {
							res.send(JSON.stringify({"passengers":result_pass}));
						});
					});
				});
			});
		}
		else {
			db.collection('passengers', function(error, coll) {
				coll.find().toArray(function(error, result) {
					var found = false;
					if (!error) {
						for (var i = 0; i < result.length; i++) {
							if (result[i].username == username) {
								found = true;
							}
						}
					}
					if (found) {
						toinsert = {
							"username": username,
							"lat": lat,
							"lng": lng,
							"created_at": time_stamp,
						};
						coll.update({"username" : username},toinsert);
					}
					else {
						toinsert = {
							"username": username,
							"lat": lat,
							"lng": lng,
							"created_at": time_stamp,
						};
						coll.insert(toinsert, function(error, saved){
						});
					}
					var fiveMinutesAgo = new Date(new Date().getTime() - 1000 * 60 * 5);
					db.collection('vehicles', function(error, coll_veh) {
						coll_veh.find({"created_at" : {$gt : fiveMinutesAgo}}).toArray(function(error1, result_veh) {
							res.send(JSON.stringify({"vehicles":result_veh}));
						});
					});
				});
			});
		}
	}

});


app.listen(process.env.PORT || 8888);

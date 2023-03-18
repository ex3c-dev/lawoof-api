import process from 'node:process';
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const msgBuilder = require('./lib/MessageBuilder');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const MongoClient = require('mongodb').MongoClient;
const MongoServer = require('mongodb').Server;
const Assert = require('assert');

const DBName = process.env.DBName;
const DBUser = process.env.DBUser;
const DBPwd = process.env.DBPwd;
const Url = 'mongodb://'+DBUser+':'+DBPwd+'@localhost:27017/'+DBName;

const app = express();

/** MongoDB reference - used to access the database. **/
var MongoDB;

/** EJS-ViewEngine for testing purposes loads html views **/
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/user/new', function(req, res){

    var pwd_plain = req.body.pwd;

    bcrypt.hash(pwd_plain, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        var User = {
            email: req.body.email,
            last_name: req.body.lastname,
            name: req.body.name,
            address: {
                street: req.body.street,
                city: req.body.city,
                zip: req.body.zip
            },
            username: req.body.username,
            pwd: hash,
            pets:[]
        };
        /** TODO: Sanitize input **/
    
        var Response = res;
     
        MongoDB.collection("users").insertOne(User, function(err, res = res){
            msgBuilder.createResponse(err, 'User' + req.body.email + 'registered!', null).then((succ, usucc) => {
                console.log('Response: %j', err);
                Response.send(succ);
            });
        });
    });

    
});

app.post('/user/login', function(req, res){
    // TODO basic login first later: OAuth!
    
    var Email = req.body.email;
    var Password = req.body.pwd;

    var Response = res;

    MongoDB.collection("users").findOne({email: Email}, function(err, result) {
        // check if user has been found with provided email
        if (typeof result !== 'undefined' && result !== null){
            console.log(err);
            var hash = result["pwd"];
            delete result["pwd"];

            bcrypt.compare(Password, hash, function(err, resLogin) {
                if(resLogin)
                {
                    Response.json({status: 'Success', value:result});
                } 
                else 
                {
                    Response.json({status: 'Error', value:"User/Password is not correct!"});
                }

            });
        } 
        else 
        {
            Response.json({status: 'Error', value:"User/Password is not correct!"});
        }     
    });
    
});

app.post('/user/test', function(req, res){
    // TODO basic login first later: OAuth!
    
    var Email = req.body.email;
    var Password = req.body.pwd;

    var Response = res;

    bcrypt.genSalt(saltRounds, function(err, genSalt) {
        bcrypt.hash(Password, genSalt, function(err, genHash) {
            var pwStruct = {hash:genHash, salt:genSalt};

            Response.json({status: 'Success', value:pwStruct});
        });
    });
});

app.post('/walks/get', function(req, res){
    var Response = res;
    var Email = req.body.email;
    MongoDB.collection("walks").find({email: Email}).toArray(function(err,result) {
        Assert.equal(null, err);
        console.log("One document updated");
        Response.json({status: 'Success', value:result});
    });
});

app.post('/walks/add', function(req, res){
    var Walks = {
        email: req.body.email,
        title: req.body.title, 
        date: req.body.date, 
        time: req.body.time,
        description: req.body.description,
        difficulty: req.body.difficulty,
        location: req.body.location,
        locationname : req.body.locationname,
        locationtype: req.body.locationtype,
        participants: []
    };

    var Response = res;

    MongoDB.collection("walks").insertOne(Walks, function(err, res = res){
        Assert.equal(null, err);

        console.log('Response: %j', Walks);
        Response.send(Walks);
    });
});

app.post('/walks/update/participants', function(req, res){
    // TODO Add walk id to database
    var Email = req.body.email;
    var ParticipantID = req.body.participant;

    var Query = { email: Email };
    var Newvalues = { $addToSet: {participants: {email: ParticipantID}} };

    var Response = res;

    MongoDB.collection("walks").updateOne(Query, Newvalues, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
        Response.json({status: 'Success', value:Newvalues});
    });
});

app.post('/pets/add', function(req, res){
    var Response = res;
    var Pet = {
        email: req.body.email,
        name: req.body.name,
        age: req.body.age,
        class: req.body.class,
        species: req.body.species,
        breed: req.body.breed,
        color: req.body.color,
        sex: req.body.sex,
        castrated: req.body.castrated,
        friendliness: req.body.friendliness,
        description: req.body.description,
        last_seen: {
            longitude: 0,
            latitude: 0
        },
        positions: []
    };
    MongoDB.collection("pets").insertOne(Pet, function(err, result) {
       Assert.equal(null, err);
        console.log("One document updated");
        Response.json({status: 'Success', value:result});
    });
    
});

app.post('/pets/update/location', function(req, res){
    // TODO
});

app.post('/pets/get/byemail', function(req, res){
    var Email = req.body.email
    var Response = res;
    MongoDB.collection("pets").find({email: Email}).toArray(function(err,result) {
        Assert.equal(null, err);
        console.log("One document updated");
        Response.json({status: 'Success', value:result});
    });
});

app.get('/', function(req, res) {
    MongoDB.collection("users").find({}).toArray(function(err, result){
        Assert.equal(null, err);
        
        res.render('index', {users:result});
    });
    
});

app.get('/users', function(req, res) {
    MongoDB.collection("users").find({}).toArray(function(err, result){
        Assert.equal(null, err);
        
        res.render('customers', {users:result});
    });
    
});

/** Starts the server and makes it listen on Port 61650 **/
app.listen(61650, function() {
    console.log('Node.js server started on Port: 61650');
    
    MongoClient.connect(Url,{ useNewUrlParser: true }, function(err, client){
        Assert.equal(null, err);
    
        console.log("Connected successfully to server.");
        
        MongoDB = client.db("lawoof");
    });
});

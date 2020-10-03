const express = require('express');
const app = express();
const PORT = 3000;
var http = require('http').createServer(app);
http.listen(3000, () => {
    console.log('listening on *:3000');
  });

var fs = require('fs');
const { Socket } = require('dgram');
var index = fs.readFileSync('index.html');
var mysql = require('mysql');

// connect to mysql db
var con = mysql.createConnection({
  host: "localhost",
  user: "nodejs",
  password: "shamgram",
  database: "shamgram",
  port: 8889
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.end(index);
});

app.post('/upload', (req, res) => {
    console.log(req.file);
    if(req.file) {
        console.log("Connected!");
        var query = "INSERT INTO photos (photoFile) VALUES ?";
        var values = {photoFile: req.file};
        con.query(query, values, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted, ID: " + result.insertId);
        });
    }
    else throw 'error';
});

var io = require('socket.io').listen(http);

io.on('connection', function(socket){
    // gets lists of all photo ids from db and sends them back in a array
    socket.on('getListOfPhotos', function(){
    con.query("SELECT photoID FROM photos", function (err, result, fields) {
        if (err) throw err
        var ids = [];
        result.forEach(function(row) {
            ids.push(row.photoID);
         });
        socket.emit("receivePhotoIDs", {photoIDs:ids});
    });
    });
    
    // getting comments for DB by photo id and sends them back in a array
    socket.on('getCommentsByID', function(data){
        var commentsArray = [];
        var photoID = data.photoID;
        var query = 'SELECT comment FROM comments WHERE photoID=?'
        con.query( query, [photoID], function (err, result, fields) {
            if (err) throw err
            // puts just the comment value the results into comments array
            result.forEach(function(row) {
                commentsArray.push(row.comment);
            });
            // sends to client
            socket.emit( 'commentsFromServer', {comments: commentsArray, photoID: photoID});  
        });        
             
    });

    // getting the likes from DB by photo id 
    socket.on('getLikesByID', function(data){
        console.log('getting likes');
        var photoID = data.photoID;
        var likeArray = [];
        // make sql querry to get like count from like table by photo id
        var sql = 'SELECT likeTally FROM likeCounter WHERE photoID = ?';
        con.query( sql, [photoID], function (err, result, fields) {
            if (err) throw err
            result.forEach(function(row) {
                likeArray.push(row.likeTally);
            });
            socket.emit( 'likesFromServer', {likes: likeArray, photoID: data.photoID});
            
        });
    });

    // uploading a comment to db based on photoid
    socket.on('sendComment', function(data){
        photoID = data.photoID;
        // comment from users input
        comment = data.comment;
        var sql = "INSERT INTO `comments` (`photoID`, `comment`) VALUES ('?', ?)";
        // inserts comment into comments by photoID 
        con.query( sql, [photoID, comment], function (err, result, fields) {
            if (err) throw err
            console.log(result);
            });
        // after uploading will pass back the photo id to reload the comments
        socket.emit( 'reloadCommentsFromServer', { photoID: photoID});
    });

    // adding a like
    socket.on('addLike', function(data){
        var photoID = data.photoID;
        console.log(photoID);
        var likeArray = [];
        // first query gets the total like by photo id
        var sql = 'SELECT likeTally FROM likeCounter WHERE photoID = ?';
        con.query( sql, [photoID], function (err, result, fields) {
            if (err) throw err
            result.forEach(function(row) {
                // gets the number of likes and puts in likeArray
                likeArray.push(row.likeTally);
            });
            // second query updates the like total with the new value
            var sql2 = 'UPDATE `likeCounter` SET `likeTally`=? WHERE photoID=?';
            // adds 1 to likeArray
            likeArray ++;
            con.query( sql2, [likeArray, photoID], function (err, result, fields) {
                if (err) throw err
                });
            // sends the like total and photo id back to client
            socket.emit( 'likesFromServer', {likes: likeArray, photoID: data.photoID});
        });
    });

    // retreives photo file from db based on photo id
    socket.on("getPhotoByID", function(data){
            console.log("photos ID Requested again")
            var photoID = data.photoID;
            var sql = 'SELECT photoFile FROM photos WHERE photoID = ?';
            console.log(photoID);
            con.query(sql, [photoID], function (err, result) {
                if (err) throw err;
                socket.emit ("receivePhoto", {photo: result[0].photoFile, photoID: photoID}); // results is 0 because it's the first photo always in the string
                });
    });
});


    
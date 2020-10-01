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

    socket.on('getListOfPhotos', function(){
    con.query("SELECT photoID FROM photos", function (err, result, fields) {
        if (err) throw err
        console.log(result);
        var ids = [];
        result.forEach(function(row) {
            ids.push(row.photoID); // figure this out
         });
        console.log(ids);
        socket.emit("receivePhotoIDs", {photoIDs:ids});
    });
    });
    
    // getting comments for DB
    socket.on('getCommentsByID', function(data){
        var commentsArray = [];
        
        // make sql querry with photoID
        var photoID = data.photoID;
        var query = 'SELECT comment FROM comments WHERE photoID=?'
        con.query( query, [photoID], function (err, result, fields) {
            if (err) throw err
            console.log(result);
            // put the results into comments array
            result.forEach(function(row) {
                commentsArray.push(row.comment);
                console.log(row.comment);
                
            });
            console.log('asdkjgh'); 
            socket.emit( 'commentsFromServer', {comments: commentsArray, photoID: photoID});  
        });        
             
    });

    // getting likes from DB
    socket.on('getLikesByID', function(data){
        console.log('getting likes');
        var photoID = data.photoID;
        var likeArray = [];
        // make sql querry to get like count from like table by photo id
        var sql = 'SELECT likeTally FROM likeCounter WHERE photoID = ?';
        con.query( sql, [photoID], function (err, result, fields) {
            if (err) throw err
            console.log('_________________');
            console.log(result);
            result.forEach(function(row) {
                likeArray.push(row.likeTally);
                console.log(row.likeTally);
                
            });
            console.log(likeArray);
            socket.emit( 'likesFromServer', {likes: likeArray, photoID: data.photoID});
            
        });
        
    });




    // uploading a comment
    socket.on('sendComment', function(data){
        console.log(data.comment);
        console.log(data.photoID);

        photoID = data.photoID;
        comment = data.comment;
        // take the comment 
        // don't think this is write we want what was sent as "comment: comment.value" and we want the photo id's value "photoid: photoid"
        var sql = "INSERT INTO `comments` (`photoID`, `comment`) VALUES ('?', ?)";
        // // insert into comments table the comment to the photoID 
        // // ***** does the photo id and comment go into [] or not?
        con.query( sql, [photoID, comment], function (err, result, fields) {
            if (err) throw err
            console.log(result);
            });
        socket.emit( 'reloadCommentsFromServer', { photoID: photoID});

    });

    // adding a like
    socket.on('addLike', function(data){
        console.log('got like');
        var photoID = data.photoID;  // or is it .value?
        console.log(photoID);
        var likeArray = [];

        var query = "SELECT likeTally FROM likeCounter WHERE = ?";
        var sql = 'SELECT likeTally FROM likeCounter WHERE photoID = ?';
        con.query( sql, [photoID], function (err, result, fields) {
            if (err) throw err
            console.log('_________________');
            console.log(result);
            result.forEach(function(row) {
                likeArray.push(row.likeTally);
                console.log(row.likeTally);
                
            });
            var sql2 = 'UPDATE `likeCounter` SET `likeTally`=? WHERE photoID=?';
            likeArray ++;
            console.log(likeArray);
            con.query( sql2, [likeArray, photoID], function (err, result, fields) {
                if (err) throw err
                console.log('sucess');
                console.log(result);
                    
                });
            console.log(likeArray);
            socket.emit( 'likesFromServer', {likes: likeArray, photoID: data.photoID});
            
        });
    });

    // socket.on("getPhotoIDs", function(data){
    //     console.log("Photo IDs Requested")
    //     con.query("SELECT photoID FROM photos", function (err, result, fields) {
    //         if (err) throw err
    //         console.log(result);
    //         var ids = [];
    //         result.forEach(function(row) {
    //             ids.push(row.photoID); // figure this out
    //         });
    //         console.log(ids);
    //         socket.emit("receivePhotoIDs", {photoIDs:ids});
    //     });
        
    // });

    socket.on("getPhotoByID", function(data){
            console.log("photos ID Requested again")
            var photoID = data.photoID;
            var sql = 'SELECT photoFile FROM photos WHERE photoID = ?';
            console.log(photoID);
            con.query(sql, [photoID], function (err, result) {
                if (err) throw err;
                socket.emit ("receivePhoto", {photo: result[0].photoFile, photoID: photoID}); // figure this out
                console.log("sent photos to the server " + photoID);
                });
    });

    // ******************************* get 2nd post *****************************************

    socket.on('getCommentsByID2', function(data){
        var commentsArray = [];
        
        // make sql querry with photoID
        var photoID = 2;
        var query = 'SELECT comment FROM comments WHERE photoID=?'
        con.query( query, [photoID], function (err, result, fields) {
            if (err) throw err
            console.log(result);
            // put the results into comments array
            result.forEach(function(row) {
                commentsArray.push(row.comment);
                console.log(row.comment);
                
            });
            console.log('c'); 
            socket.emit( 'commentsFromServer2', {comments: commentsArray, photoID: photoID});  
        });        
             
    });


        
    });


    
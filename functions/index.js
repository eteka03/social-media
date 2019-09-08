const functions = require('firebase-functions');


//initialiser express pour simplifier les routes
const express= require('express');
const app =  express();

const {getAllScreams,postOneScream,getScream,commentOnScream,likeScream,unlikeScream} = require('./handlers/scream');
const {signUp,login,uploadImage,addUserDetails,getAuthenticatedUser} = require('./handlers/users');

const FBAuth = require('./util/FBAuth')

//users routes

app.post('/signup',signUp);

app.post('/login',login);

app.post('/user/image',FBAuth,uploadImage);

app.post('/user',FBAuth,addUserDetails);



// screams routes
 app.get('/screams',getAllScreams);
 app.get('/user',FBAuth,getAuthenticatedUser);
 app.get('/scream/:screamId',getScream);

app.post('/scream/:screamId/comment',FBAuth,commentOnScream);
app.get('/scream/:screamId/like',FBAuth,likeScream);
 





 //post one scream

 app.post('/scream',FBAuth,postOneScream);


 
 


 



 exports.api = functions.https.onRequest(app);



const {admin,db} = require('../util/admin');

const config = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(config);

const {validateSigneUpData,validateLoginData,reduceUserDetails} = require('../util/validator');

// user signup
exports.signUp = (req,res)=>{
    const newUser = {
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle
    };

  
    const { valid, errors } = validateSigneUpData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = 'blank-profile-picture-973460_1280.png';
    
    let token,userId;

    db.doc(`/users/${newUser.handle}`).get()
    .then((doc)=>{
        if(doc.exists){
            return res.status(400).json({handle:'this handle is already taken'})
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password)

        }
    })
    .then(data=>{
        userId = data.user.uid;
        return data.user.getIdToken()
    })
    .then((idToken)=>{
        token =  idToken ; 

        const userCredentials = {
            userHandle:newUser.handle,
            email:newUser.email,
            createdAt:new Date().toISOString(),
            imageUrl:`https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId
        };

      return  db.doc(`users/${newUser.handle}`).set(userCredentials)
       
    })
    .then(()=>{
        return res.status(201).json({token})
    })
    .catch((err)=>{
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({email:'email already in use'})
        }else{
           console.error(err);
           return res.status(500).json({error:err.code})
        }
        
    });

  
}

//user login
exports.login = (req,res)=>{

    const user = {
        email:req.body.email,
        password: req.body.password
    };

    const{valid,errors} =validateLoginData(user);
    if(!valid) return status(400).json(errors);
  
        firebase.auth().signInWithEmailAndPassword(user.email,user.password)
        .then(data =>{
            return data.user.getIdToken()
        })
        .then(token =>{
            return res.json({token})
        })
        .catch(err=>{
            console.error(err);
            return res.status(500).json({error:err.code})
        })
 }



 //upload usr image
 exports.uploadImage =(req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
  
    const busboy = new BusBoy({ headers: req.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(fieldname, file, filename, encoding, mimetype);
      if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        return res.status(400).json({ error: 'Wrong file type submitted' });
      }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
      admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype
            }
          }
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
            config.storageBucket
          }/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        })
        .then(() => {
          return res.json({ message: 'image uploaded successfully' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: 'something went wrong' });
        });
    });
    busboy.end(req.rawBody);
  };


  //add user details

  exports.addUserDetails = (req,res)=>{
let userDetails = reduceUserDetails(req.body);

   db.doc(`/users/${req.user.handle}`).update(userDetails)
   .then(()=>{
       return res.json({message:'details added successfully'});


   })
   .catch(err=>{
       console.error(err);
       return res.json({error:err.code});
   })
  }



  //get own user details
  exports.getAuthenticatedUser =(req,res)=> {

    let userData  ={};

    db.doc(`/users/${req.user.handle}`).get()
    .then(doc=>{
        if(doc.exists){
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle','==',req.user.handle).get() 
        }

    })
    .then(data =>{
        userData.likes = [],
        data.forEach(doc=>{
            userData.likes.push(doc.data());
        });
        return res.json(userData)
    })
    .catch(err=>{
        console.error(err);
        return res.status(500).json({error:err.code})  
    })

  }


 
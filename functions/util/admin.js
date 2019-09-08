//initialiser l'application avc la bd de firebase
const admin =  require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

module.exports = {admin,db};
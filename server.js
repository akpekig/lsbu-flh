var express = require('express');
var app = express();
var bodyParser=require("body-parser");
var document = { };
var submissionsList = { };
var caseDocuments = { };
let extraData;
let caseID;

const host = '0.0.0.0';
const port = process.env.PORT || 5000;

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://LSBULC:dyg3LmLdwdyc@legalclinicsubmissions.y0jds.mongodb.net/database?retryWrites=true&w=majority";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });


const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lsbuflh@gmail.com',
    pass: 'LSBUflh1234' // naturally, replace both with your real credentials or an application-specific password
  }
});

const mailOptions = {
  from: 'lsbuflh@gmail.com',
  to: 'lsbuflh@gmail.com',
  subject: 'LSBU Family Law Hub Application',
  text: 'A client has recently submitted a form. Visit your dashboard to view details and assign the case to your students.',
  html:'<div style="font-family: \'Arial\', sans-serif;"><h1>A client has recently submitted a form.</h1><p> Click <a href="#" alt="Admin Dashboard">here</a> to view details and assign the case to your students.</p></div><body>',
};

async function add() {
    try {
         await client.connect();
         console.log("Connected correctly to server");
         const db = client.db("database");
         var submissions = await db.collection("submissions").insertOne(document);
         let submitted = 1;
         console.log("Submitted.");
   } catch (err) {
         console.log(err.stack);
     }

     finally {
        await client.close();
    }
}

async function load() {
    try {
         await client.connect();
         console.log("Connected correctly to server");
         const db = client.db("database");
         submissionsList = await db.collection("submissions").find().toArray();
         console.log(submissionsList);
         console.log("Retrieved");
   } catch (err) {
         console.log(err.stack);
     }

}

async function studentLoad() {
    try {
         await client.connect();
         console.log("Connected correctly to server");
         const db = client.db("database");
         caseDocuments = await db.collection("submissions").find( { "_id": require('mongodb').ObjectID(caseID) } ).toArray();
         console.log(caseDocuments);
         console.log("Retrieved");
   } catch (err) {
         console.log(err.stack);
     }

}
async function updateDetail() {
    try {
         console.log("Connected correctly to server");
         const db = client.db("database");
         console.log('Assigning case ' + caseID + ' to students.');
         await db.collection("submissions").findOneAndUpdate(
           { "_id": require('mongodb').ObjectID(caseID) },
           { "$set": { "extraDetails": extraDetails } },
           { returnNewDocument: true });
         console.log("Case assigned.");
         res.redirect('/dashboard-admin');
   } catch (err) {
         console.log(err.stack);
     }
}

async function assign() {
    try {
         console.log("Connected correctly to server");
         const db = client.db("database");
         console.log('Assigning case ' + caseID + ' to students.');
         await db.collection("submissions").findOneAndUpdate(
           { "_id": require('mongodb').ObjectID(caseID) },
           { "$set": { "status": "assigned" } },
           { returnNewDocument: true });
         console.log("Case assigned.");
         res.redirect('/dashboard-admin');
   } catch (err) {
         console.log(err.stack);
     }
}

async function close() {
    try {
         //await client.connect();
         console.log("Connected correctly to server");
         const db = client.db("database");
         console.log('Closing case ' + caseID)
         await db.collection("submissions").findOneAndUpdate(
           { "_id": require('mongodb').ObjectID(caseID) },
           { "$set": { "status": "closed" } },
           { returnNewDocument: true });
         console.log("Case closed.");
   } catch (err) {
         console.log(err.stack);
     }

}

async function delete() {
    try {
         //await client.connect();
         console.log("Connected correctly to server");
         const db = client.db("database");
         console.log('Deleting case ' + caseID)
         await db.collection("submissions").findOneAndDelete(
           { "_id": require('mongodb').ObjectID(caseID) },
           {}
         );
         console.log("Case deleted.");
   } catch (err) {
         console.log(err.stack);
     }

}


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

// submission
app.post('/submit', function(req, res){
    let submitted = 0;
    document = req.body;
    document.status = "unassigned";
    document.date = new Date().toLocaleDateString();
    add().catch(console.dir);
    transporter.sendMail(mailOptions, function(error, info){
  if (error) {
	console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
    res.render('pages/submit', { submitted : submitted });

});

// admin dashboard
app.get('/dashboard-admin', function(req, res) {
    load().catch(console.dir);
    res.render('pages/dashboard-admin', { submissions: submissionsList});
});


app.post('/dashboard-admin/assign', function(req, res) {
  console.log(req.body)
    caseID = req.body.caseID;
    let buttonAction = req.body.buttonAction;
    if (buttonAction == 'assign'){
      assign().catch(console.dir);
      res.redirect('/dashboard-admin');
    } else if (buttonAction == 'close') {
      close().catch(console.dir);
      res.redirect('/dashboard-admin');
    } else if (buttonAction == 'delete') {
      return res.render('/pages/delete', { caseID: caseID });
    }

});

// admin dashboard delete
app.post('/delete', function(req, res) {
    caseID = req.body.caseID;
    delete().catch(console.dir);
    res.redirect('/dashboard-admin');
});

// student dashboard
app.get('/dashboard-student', function(req, res) {
    res.render('pages/dashboard-student');
});
app.post('/dashboard-student/find', function(req, res) {
    caseID = req.body.caseID;
    studentLoad().catch(console.dir);
    res.render('pages/find', { documents: caseDocuments });
});
app.post('/dashboard-student/find/updateDetail', function(req, res) {
    extraDetails = req.body.extraDetails;
    studentLoad().catch(console.dir);
    res.render('pages/find', { documents: caseDocuments });
});

app.listen(port, host);
console.log('5000 is the magic port');

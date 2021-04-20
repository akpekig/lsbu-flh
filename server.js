var express = require('express');
var app = express();
var bodyParser=require("body-parser");
var document = { };
var submissionsList = { };

const host = '0.0.0.0';
const port = process.env.PORT || 5000; //port number (5000) is neither necessary nor constant per application.

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://<username>:<password>@<mongodbcluster>.mongodb.net/<database>?retryWrites=true&w=majority"; //replace parameters as needed.
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });


const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: 'gmail', // change email provider as needed 
  auth: {
    user: 'email@email.com',
    pass: 'password' // naturally, replace both with your real credentials or an application-specific password
  }
});

const mailOptions = {
  from: 'from@mail.com',
  to: 'to@mail.com',
  subject: 'LSBU Family Law Hub Application',
  text: 'A client has recently submitted a form. Visit your dashboard to view details and assign the case to your students.',
  html:'<div style="font-family: \'Arial\', sans-serif;"><h1>A client has recently submitted a form.</h1><p> Click <a href="dashboard-link" alt="Admin Dashboard">here</a> to view details and assign the case to your students.</p></div><body>',
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

     /*finally {
        await client.close();
    }*/
}



app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// index page
app.get('/', function(req, res) {
    res.render('pages/index');
    //console.log(req.formPage.formJSON);
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
    res.render('pages/dashboard-admin', { submissions: submissionsList });
});

app.listen(port, host);

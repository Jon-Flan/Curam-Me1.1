//web app section for Curam Me medical App

var express = require("express"); //call the express module 
var session = require("express-session");//call the express sessions module
var app = express(); //declaration of app, initialising it as an object express 
var bodyParser = require('body-parser');//allow access to body parser
var mysql = require('mysql');//alows access to mysql and connect to our database

//create the connection variable for the database with all arguments for connection
// *** The database is a secure server database and only white listed IP's can connect **
var connection = mysql.createConnection({
	host:'mysql4220.cp.blacknight.com',
	user:'u1518531_user00',
	password:'cU*@mM3^_q',
	database:'db1518531_curamme'
});

connection.connect(function(error){
	if(!!error){
		console.log('Error Connecting to server');
	}else{
		console.log('Connection success');
	}
});


//set the app to use a session cookie
app.use(session({
	secret:'!dy1aReAaq',
	resave:true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended:true}));
//set the app to use the specific folders
app.use(express.static("views")); //use the public folder pages
app.use(express.static("scripts")); //use the scripts folder for functionality
app.use(express.static("images")); //use the images folder for images

//setting the view engine
app.set('view engine','ejs');


//create and provide the server port for the app
app.listen(80, function(){
	console.log("Server is running correctly");
});

//route to login page
app.get('/', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	if(req.session.loggedin){
		res.redirect("home"); //home is the main task page
	}else{
		res.render("index");
	}
	res.end();
});

//sign in route, test and redirect if the users credentials are correct, else redirect back to the incorrect login page
app.post('/login', async(req,res) =>
{
	var username = req.body.username; //get the username from the login page submission
	var password = req.body.password; //get the password from the login page submission

	if(username && password){
		//if there is a password and username, then create a query and send to the database
		connection.query("SELECT * FROM Security WHERE Username = ? AND Password = ?;", [username, password], function(error, results, fields){
			//if there is a match then set the var user to the result at index 0, there should only be one result if details are correct
			if(results.length > 0){
				let user = results[0];
				//set the login session to true for persistance of the login cookie
				req.session.loggedin = true;
				//set the username for the session to the staff id of the person who logged in, useful for adding records to the database now under that 
				//staff persons ID
				req.session.username = results[0].S_ID;

				//test outputs that will be adjusted later on
				res.redirect("home");
				res.end();
			}else{
				//if the details are wrong redirect back to the login page 
				res.render('wrong');
			}
			res.end();
		})
	}
});

//route to home page
app.get('/home', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	var today = '2020-04-01';

	if(req.session.loggedin){
		//connect to database and get tasks
		connection.query("SELECT * FROM Tasks WHERE Date = ?;",[today], function(error, results, fields){
			if(results.length > 0){
				res.render("home", {results});
			}else{
				results = [{
					T_ID:'1',
					P_ID:'1',
					Details:'None',
					Time:'none',
					Date:'none',
					Completed:'no',
					S_ID:'1'
				}]
				res.render("home", {results});
			}
		})
	}else{
		res.redirect("/");
		res.end();
	}
	
});

//route to patient search page
app.get('/patient', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	if(req.session.loggedin){
		res.render("patient");
	}else{
		res.redirect("/");
	}
	res.end();
});


//route for the search patient ID section, if ID is not in system redirected to error page
app.post('/Search',function(req,res)
{

	var patientID = req.body.patientSearch; //get the patient ID from the search

	if(req.session.loggedin)
	{
		connection.query("select * from Patients where P_ID = ?;", [patientID], function(error, results, fields)
		{
			if(results.length > 0)
			{
				
				res.render("patientCorrect",{results});
			}else
				res.render("patientWrong");
		});

	}
	else
	{
		res.redirect("/");
		res.end();
	}


});

//route to the patients  page back from the vitals page
app.get('/patientCorrect/:P_ID', function(req, res){
 //first check if the user is logged in and if not redirect to login page 
 if(req.session.loggedin){
		//connect to the databse and select the correct values
		connection.query("select * FROM Patients where P_ID = ?;", [req.params.P_ID], function(error, results,fields){
		if(results.length > 0){
				res.render("patientCorrect",{results});
			}else{
				res.redirect("patient");
			}
		});	
	}else{
		res.redirect('/');
		res.end();	
	}	
});

//route to the patients vitals page
app.get('/vitals/:P_ID', function(req, res){
 //first check if the user is logged in and if not redirect to login page 
 if(req.session.loggedin){
		//connect to the databse and select the correct values
		connection.query("select * FROM Patients where P_ID = ?;", [req.params.P_ID], function(error, results,fields){
		if(results.length > 0){
				res.render("vitals",{results});
			}else{
				res.redirect("patient");
			}
		});	
	}else{
		res.redirect('/');
		res.end();	
	}	
});



//route to the patients PRN page
app.get('/prn/:P_ID', function(req, res){
 //first check if the user is logged in and if not redirect to login page 
 if(req.session.loggedin){
		//connect to the databse and select the correct values
		connection.query("select * FROM Patients where P_ID = ?;", [req.params.P_ID], function(error, results,fields){
		if(results.length > 0){
				res.render("prn",{results});
			}else{
				res.redirect("patient");
			}
		});	
	}else{
		res.redirect('/');
		res.end();	
	}	
});



//route to ward info page
app.get('/ward', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	if(req.session.loggedin){
		res.render("ward");
	}else{
		res.redirect("/");
	}
	res.end();
});


//logout feature to destroy session and redirect to login page
app.get('/logout', function(req,res, next){
	req.session.destroy();
	res.redirect('/');
})










//web app section for Curam Me medical App

var express = require("express"); //call the express module 
var session = require("express-session");//call the express sessions module
var app = express(); //declaration of app, initialising it as an object express 
var bodyParser = require('body-parser');//allow access to body parser
var mysql = require('mysql');//alows access to mysql and connect to our database

//create the connection variable for the database with all arguments for connection
// *** The database is a secure server database and only white listed IP's can connect **
var connection = mysql.createConnection({
	host: 'mysql4341.cp.blacknight.com',
	user: 'u1518531_user01',
	password: 'cU*@mM3^_q',
	database: 'db1518531_curammet'
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
		connection.query("SELECT s.S_ID as NurseID, s.FName as FirstName, s.LName as LastName, w.Ward_Name as WardName, w.W_ID as WardID, sec.Sec_ID as SecurityID FROM Staff s, Ward w, Security sec WHERE sec.Username = ? and sec.Password = ? and sec.S_ID = s.S_ID and s.W_ID = w.W_ID GROUP BY s.S_ID, s.FName, s.LName, w.Ward_Name, w.W_ID, sec.Sec_ID;", [username, password], function(error, results, fields){
			//if there is a match then set the var user to the result at index 0, there should only be one result if details are correct
			if(results.length > 0){
				let user = results[0];
				//set the login session to true for persistance of the login cookie
				req.session.loggedin = true;
				//set the username for the session to the staff id of the person who logged in, useful for adding records to the database now under that 
				//staff persons ID
				req.session.username = results[0].NurseID;
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
	var today = '2020-05-05';

	if(req.session.loggedin){
		//connect to database and get tasks
		connection.query("SELECT t.T_ID as Task_ID, p.FName as FirstName, p.LName as LastName, t.Details as Task, t.Time_Due as Time, t.Date_Due as Date, t.Completed as Completed, w.Ward_Name as Ward, pd.P_ID as PatientID, pd.Bed_No FROM Patients p, Tasks t, Ward w, Patient_Details pd, Staff n WHERE t.Date_Due = '2020-05-05' and n.S_ID = ? and w.W_ID = n.W_ID and p.P_ID = t.P_ID and pd.W_ID = w.W_ID and t.P_ID = pd.P_ID and t.Completed = false GROUP BY t.T_ID, p.FName, p.LName, t.Details, t.Time_Due, t.Date_Due, t.Completed, w.Ward_Name, pd.P_ID, pd.Bed_No;",[req.session.username], function(error, results, fields){
			if(results.length > 0){
				//change the integer boolean value from the databse to yes or no for easier readability
				results.forEach(function(results){
					if(results.Completed == 1){
					results.Completed = 'Yes';
					}else{
						results.Completed = 'No'
					}
				})
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

//route to the selected task
app.get('/task/:T_ID', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	if(req.session.loggedin){
		//get the ask information from the database
		connection.query("SELECT t.T_ID as Task_ID, p.FName as FirstName, p.LName as LastName, t.Details as Task, t.Time_Due as Time, t.Date_Due as Date, t.Completed as Completed, w.Ward_Name as Ward, pd.P_ID as PatientID, pd.Bed_No FROM Patients p, Tasks t, Ward w, Patient_Details pd, Staff n WHERE t.T_ID = ? and p.P_ID = t.P_ID and t.P_ID = pd.P_ID and w.W_ID = n.W_ID and pd.W_ID = w.W_ID GROUP BY t.T_ID, p.FName, p.LName, t.Details, t.Time_Due, t.Date_Due, t.Completed, w.Ward_Name, pd.P_ID, pd.Bed_No;",[req.params.T_ID], function(error, results, fields){
			if(results.length > 0)
			{	
				results.forEach(function(results){
					if(results.Completed == 1){
					results.Completed = 'Yes';
					}else{
						results.Completed = 'No'
					}
				})
				res.render("task",{results});
			}else
				res.redirect("home");
		})

	}else{
		res.redirect("/");
		res.end();
	}

})

//route to view completed tasks
app.get('/completed', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	var today = '2020-05-05';

	if(req.session.loggedin){
		//connect to database and get the ward ID for the staff member and use in the query to find all completed tasks for that ward
		connection.query("SELECT W_ID FROM Staff WHERE S_ID = ?",[req.session.username], function(error, results, fields){
			if(results.length > 0){
				var W_ID = results[0].W_ID;
				connection.query("SELECT p.FName as FirstName, p.LName as LastName, t.Details as Task, t.Time_Due as Time_Due, t.Date_Due as Date_Due,t.Time_Completed as Time_Completed, t.Date_Completed as Date_Completed, t.Completed as Completed, pd.Bed_No, n.FName as NurseFN, n.LName as NurseLN, w.Ward_Name as Ward, pd.P_ID FROM Patients p, Tasks t, Staff n, Ward w, Patient_Details pd WHERE t.Date_Due = '2020-05-05' and w.W_ID = ? and p.P_ID = t.P_ID and pd.W_ID = w.W_ID and t.P_ID = pd.P_ID and t.Completed = true and n.S_ID = t.S_ID GROUP BY p.FName, p.LName, t.Details, t.Time_Due, t.Date_Due,t.Time_Completed, t.Date_Completed, t.Completed, n.FName, n.LName, w.Ward_Name, pd.P_ID, pd.Bed_No;",[W_ID], function(error,results,fields){
					if(results.length > 0)
					{
					res.render("completed", {results});
					}else
					res.render("noCompleted");
					})
			}else{
				
				res.redirect("home");
			}
		})
	}else{
		res.redirect("/");
		res.end();
	}
});

//route to log a task done in database
app.post('/taskDone/:Task_ID', function(req,res){
	var date = new Date();
    var hours = date.getHours(1) < 10 ? "0" + date.getHours(1) : date.getHours(1);
    var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var time = hours + ":" + minutes + ":" + seconds;
	var t_ID = Number(req.params.Task_ID);
	//check if the user is already logged in and redirect to the correct page
	if(req.session.loggedin){
		try{
		connection.query("UPDATE Tasks SET Completed = true, Time_Completed = ?, Date_Completed = '2020-05-05', S_ID = ? WHERE T_ID = ? ;",[time, req.session.username, t_ID] , function(err, results, fields){
			if(err)throw err;
			console.log("1 record inserted")
		});
		connection.query("SELECT t.T_ID as Task_ID, p.FName as FirstName, p.LName as LastName, t.Details as Task, t.Time_Due as Time, t.Date_Due as Date, t.Completed as Completed, w.Ward_Name as Ward, pd.P_ID as PatientID, pd.Bed_No FROM Patients p, Tasks t, Ward w, Patient_Details pd, Staff n WHERE t.Date_Due = '2020-05-05' and n.S_ID = ? and w.W_ID = n.W_ID and p.P_ID = t.P_ID and pd.W_ID = w.W_ID and t.P_ID = pd.P_ID and t.Completed = false GROUP BY t.T_ID, p.FName, p.LName, t.Details, t.Time_Due, t.Date_Due, t.Completed, w.Ward_Name, pd.P_ID, pd.Bed_No;",[req.session.username], function(error, results, fields){
			if(results.length > 0){
				//change the integer boolean value from the databse to yes or no for easier readability
				results.forEach(function(results){
					if(results.Completed == 1){
					results.Completed = 'Yes';
					}else{
						results.Completed = 'No'
					}
				})
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
	}catch(err){
		console.log("error inserting record")
		redirect("home");
	}
	}else{
		res.redirect("/");
		res.end();
	}
})

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
		connection.query("SELECT p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, pd.Diagnosis as Diagnosis, pd.Treatment as Treatment, pd.Doctor as Doctor, pd.Bed_No as Bed, w.Ward_Name, pd.Risk as Risk FROM Patients p, Patient_Details pd, Ward w WHERE p.P_ID = ? and p.P_ID = pd.P_ID and pd.W_ID = w.W_ID GROUP BY p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, pd.Diagnosis, pd.Treatment, pd.Doctor, pd.Bed_No, w.Ward_Name, pd.Risk;", [patientID], function(error, results, fields)
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
		connection.query("SELECT p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, pd.Diagnosis as Diagnosis, pd.Treatment as Treatment, pd.Doctor as Doctor, pd.Bed_No as Bed, w.Ward_Name, pd.Risk as Risk FROM Patients p, Patient_Details pd, Ward w WHERE p.P_ID = ? and p.P_ID = pd.P_ID and pd.W_ID = w.W_ID GROUP BY p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, pd.Diagnosis, pd.Treatment, pd.Doctor, pd.Bed_No, w.Ward_Name, pd.Risk;", [req.params.P_ID], function(error, results,fields){
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
		connection.query("Select p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, v.HR, v.BP, v.Fluids, v.Time, v.Date, s.FName as NurseFN, s.LName as NurseLN from Patients p, Vitals v, Staff s WHERE p.P_ID = ? and v.P_ID = p.P_ID and v.S_ID = s.S_ID Group by p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, v.HR, v.BP, v.Fluids, v.Time, v.Date, s.FName, s.LName Order by v.Date, v.Time Desc limit 1;", [req.params.P_ID], function(error, results,fields){
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

//post the new vitals to the database and reload vitals page
app.post('/Vitals/:P_ID', function(req, res)
{
	var HR = req.body.HR;
	var BP = req.body.BP;
	var Fluids = req.body.Fluid;
    var date = new Date();
    var hours = date.getHours(1) < 10 ? "0" + date.getHours(1) : date.getHours(1);
    var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var time = hours + ":" + minutes + ":" + seconds;

	try{
		connection.query("INSERT INTO Vitals (V_ID, P_ID, HR, BP, Fluids, Time, Date, S_ID) VALUES(Null, ?, ?, ?, ?, ?, '2020-05-05', ?);",[req.params.P_ID, HR, BP, Fluids, time, req.session.username ] , function(err, results, fields){
			if(err)throw err;
			console.log("1 record inserted")
		});
		connection.query("Select p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, v.HR, v.BP, v.Fluids, v.Time, v.Date, s.FName as NurseFN, s.LName as NurseLN from Patients p, Vitals v, Staff s WHERE p.P_ID = ? and v.P_ID = p.P_ID and v.S_ID = s.S_ID Group by p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, v.HR, v.BP, v.Fluids, v.Time, v.Date, s.FName, s.LName Order by v.Date, v.Time Desc limit 1;", [req.params.P_ID], function(error, results,fields){
		if(results.length > 0){
				res.render("vitals",{results});
			}else{
				res.redirect("patient");
			}
		});		
	}catch(err){
		console.log("error inserting record")
		redirect("home");
	}
});



//route to the patients PRN page
app.get('/prn/:P_ID', function(req, res){
 //first check if the user is logged in and if not redirect to login page 
 if(req.session.loggedin){
		//connect to the databse and select the correct values
		connection.query("SELECT p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, prn.Meds_Allowed as Meds, prnd.Meds_Dispensed as MedsDispensed, prnd.Reason as Reason, prnd.Time as Time, prnd.Date as Date, s.FName as NurseFN, s.LName as NurseLN FROM Patients p, PRN prn, PRN_Dispense prnd, Staff s WHERE p.P_ID = ? and p.P_ID = prn.P_ID and prnd.P_ID = p.P_ID and prnd.S_ID = s.S_ID Group by p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, prn.Meds_Allowed, prnd.Meds_Dispensed, prnd.Reason, prnd.Time, prnd.Date, s.FName, s.LName Order by prnd.Date, prnd.Time Desc limit 1;", [req.params.P_ID], function(error, results,fields){
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

//post the new PRN info to the database and reload PRN Page with new data
app.post('/Prn/:P_ID', function(req,res){
	var PRN = req.body.PRN;
	var Reason = req.body.Reason;
        var date = new Date();
        var hours = date.getHours(1) < 10 ? "0" + date.getHours(1) : date.getHours(1);
        var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        var time = hours + ":" + minutes + ":" + seconds;

	try{
		connection.query("INSERT INTO PRN_Dispense (Disp_ID, P_ID, Meds_Dispensed, Reason, S_ID, Time, Date) VALUES(Null, ?, ?, ?, ?, ?, '2020-05-05');",[req.params.P_ID, PRN, Reason, req.session.username, time], function(err, results, fields){
			if(err)throw err;
			console.log("1 record inserted");
		});
		connection.query("SELECT p.P_ID, p.FName as FName, p.LName as LName, p.DOB as DOB, p.Age as Age, p.Gender as Gender, p.Allergies as Allergies, prn.Meds_Allowed as Meds, prnd.Meds_Dispensed as MedsDispensed, prnd.Reason as Reason, prnd.Time as Time, prnd.Date as Date, s.FName as NurseFN, s.LName as NurseLN FROM Patients p, PRN prn, PRN_Dispense prnd, Staff s WHERE p.P_ID = ? and p.P_ID = prn.P_ID and prnd.P_ID = p.P_ID and prnd.S_ID = s.S_ID Group by p.P_ID, p.FName, p.LName, p.DOB, p.Age, p.Gender, p.Allergies, prn.Meds_Allowed, prnd.Meds_Dispensed, prnd.Reason, prnd.Time, prnd.Date, s.FName, s.LName Order by prnd.Date, prnd.Time Desc limit 1;", [req.params.P_ID], function(error, results,fields){
		if(results.length > 0){
				res.render("prn",{results});
			}else{
				res.redirect("patient");
			}
		});		
	}catch(err){
		console.log("error inserting record");
		redirect("home");
	}
});



//route to ward info page
app.get('/ward', function(req,res){
	//check if the user is already logged in and redirect to the correct page
	 if(req.session.loggedin){
		//connect to the databse and select the correct values
		connection.query("Select w.Ward_Name as Ward, w.Bed_Count as Beds, p.P_ID, p.FName as PatientFN, p.LName as PatientLN, pd.Bed_No as PatientBedNo From Ward w, Patients p, Patient_Details pd, Staff s Where s.S_ID =? and s.W_ID = w.W_ID and pd.W_ID = w.W_ID and pd.W_ID = s.W_ID and p.P_ID = pd.P_ID Group by w.Ward_Name, w.Bed_Count,p.P_ID, p.FName, p.LName, pd.Bed_No;", [req.session.username], function(error, results,fields){
		if(results.length > 0){
				res.render("ward",{results});
			}else{
				res.redirect("/");
			}
		});	
	}else{
		res.redirect('/');
		res.end();	
	}	
});


//logout feature to destroy session and redirect to login page
app.get('/logout', function(req,res, next){
	req.session.destroy();
	res.redirect('/');
})










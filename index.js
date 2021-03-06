var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Bts = require("./models/Bts");
var Comment = require("./models/comment");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var Work = require("./models/work");
var methodOverride = require("method-override");
var Project = require("./models/projects");
var expressSession = require("express-session");
var path = require("path");
var Contact = require("./models/contact");
var Team = require('./models/teams');
var mkdirp = require('mkdirp');
var multer = require('multer');


mongoose.connect("mongodb://localhost/btsCopy", { useNewUrlParser: true });

app.set("view engine", "ejs");

app.use(expressSession({
    secret: "I hope to finish this project before deadline",
    resave: false,
    saveUninitialized: false
}));

app.use(methodOverride('_method'));

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }))

var PORT = 3000;


function todayDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }
    //         const monthNames = ["January", "February", "March", "April", "May", "June",
    //   "July", "August", "September", "October", "November", "December"
    // ];
    today = mm + '/' + dd + '/' + yyyy;
    return today;
}


app.get("/", (req, res) => {
    if (req.user) {
        res.redirect("/bugs");
    } else {
        res.render("landing");
    }
});


app.get("/docs", (req, res) => {
    res.render("docs");
});

app.get("/createteam", (req, res) => {
    User.find({}, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            res.render("teams/createTeam", { User: user });
        }
    });
});

app.post("/createteam", (req, res) => {
    var teamName = req.body.teamname;
    var dateCreated = todayDate();
    var workAssigned = "NO";
    var teamMembers = req.body.users;
    Team.create({
        teamName: teamName, dateCreated: dateCreated, workAssigned: workAssigned
    }, (err, team) => {
        if (err) {
            res.redirect("/error");
        }
        for (var i = 0; i < teamMembers.length; i++) {
            var teamMember = teamMembers[i];
            User.findOneAndUpdate({ username: teamMember }, { isTeamMember: 1, team: team }, (err, user) => {
                Team.findByIdAndUpdate(team._id, { "$push": { users: user } }, (err, res) => {

                });
            });
        }
    });
    res.redirect("/teams");
});

app.get("/teams", (req, res) => {
    Team.find({}, (err, teams) => {
        if (err) {
            console.log(err);
        } else {
            res.render("teams/teams", { teams: teams });
        }
    });

});

app.get("/teams/:id", (req, res) => {
    User.find({}, (err, user) => {
        Team.findById((req.params.id), (err, teams) => {
            if (err) {
                res.redirect("/error");
            } else {
                Work.findById(teams.workId, (err, work) => {
                    res.render("teams/show", { teams: teams, User: user, work: work });
                });
            }
        });
    });
});


app.delete("/teams/:id/delete", (req, res) => {
    var id = req.params.id;
    Team.findById(id, (err, team) => {
        team.users.forEach(function (userId) {
            User.findByIdAndUpdate(userId, { "$set": { isTeamMember: 0, team: null } }, (err, res) => {
            });
        });
    });
    Work.findOneAndRemove({ team: id }, function (err) { });
    Team.findByIdAndRemove(id, function (err) {
        if (err) {
            res.redirect("/error");
        } else {
            res.redirect("/teams");
        }
    });
});


app.get("/teams/:id/assignwork", (req, res) => {
    Team.findById(req.params.id, (err, team) => {
        if (err) {
            res.redirect("/error");
        } else {
            Project.find({}, (err, project) => {
                res.render("work/AssignTeam", { team: team, Project: project });
            });
        }
    });
});

app.post("/teams/:id/assignwork", (req, res) => {
    var teamID = req.params.id;
    Work.create({
        team: teamID, dateCreated: todayDate(), dueDate: "" + req.body.dueDate,
        description: req.body.description, Project: req.body.pjname
    }, (err, work) => {
        if (err) {
            console.log(err);
            res.redirect("/error")
        } else {

            Team.findByIdAndUpdate(teamID, {
                "$set": {
                    workAssigned: "YES", workId: work._id,
                    projectWork: req.body.pjname

                }
            }, (err, res) => { });
            res.redirect("/teams/" + teamID);
        }
    })

});



app.get("/users", isLoggedIn, (req, res) => {
    User.find({}, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            res.render("user/users", { User: user });
        }
    });

});

app.get("/users/delete", (req, res) => {
    User.find({}, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            res.render("user/deleteUsers", { User: user });
        }
    });

});

app.delete("/users/delete", isLoggedIn, (req, res) => {
    var userId = req.body.users;
    Team.findOneAndUpdate({ users: { "$all": [userId] } }, { "$pullAll": { users: [userId] } }, (err, team) => {
        if (err) {
            throw err;
        }
    });


    User.findByIdAndRemove(userId, function (err) {
        if (err) {
            throw err;
        } else {
            res.redirect("/users");
        }

    });
});

app.get("/user/:id", isLoggedIn, (req, res) => {

    User.findById(req.params.id, (err, User) => {
        res.render("user/profile", { User: User });
    });
});


app.get("/user/:id/assignwork", (req, res) => {
    User.findById(req.params.id, (err, User) => {
        if (err) {
            res.redirect("/error");
        } else {
            Bts.find({}, (err, bugs) => {
                res.render("work/AssignUser", { User: User, Bug: bugs });
            });
        }
    });
});



app.post("/user/:id/assignwork", (req, res) => {
    var userID = req.params.id;
    Work.create({
        user: userID, dateCreated: todayDate(), dueDate: "" + req.body.dueDate,
        description: req.body.description, Bug: req.body.bugName
    }, (err, work) => {
        if (err) {
            console.log(err);
            res.redirect("/error");
        } else {
            Bts.findByIdAndUpdate(work.Bug,{
                "$set": {
                    status: "ASSIGNED",
                    userAssigned : work.user
                }  
            },(err, res) => { });
            User.findByIdAndUpdate(userID, {
                "$set": {
                    workAssigned: "YES", 
                    workId: work._id
                }
            }, (err, res) => { });
            res.redirect("/user/" + work.user);
        }
    })

});








// Adding Image upload logic

//setting storage engine


// end of image upload logic



app.get("/user/:id/edit", isLoggedIn, (req, res) => {
    var id = req.user._id;
    User.findById(req.params.id, (err, User) => {
        if (req.user.isAdmin == 1 || id == req.params.id) {
            res.render("user/profileEdit", { User: User });
        } else {
            res.send("You are not Authorized !!!");
        }
    });

});

app.put("/user/:id", isLoggedIn, (req, res) => {
    var FullName = req.body.FullName;
    var mNumber = req.body.mNumber;
    var email = req.body.email;
    var gender = req.body.gender;
    var UpdatedUser = {
        FullName: FullName, mNumber: mNumber,
        email: email, gender: gender
    };

    User.findByIdAndUpdate(req.params.id, UpdatedUser, function (err, UpdatedUser) {
        if (err) {
            res.redirect("/error");
        } else {

            res.redirect("/user/" + req.params.id);
        }
    });
});


app.get("/bugs", isLoggedIn, (req, res) => {

    Bts.find({}, (err, bugs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/bugs", { bugs: bugs });
        }
    })
});


app.post("/bugs", isLoggedIn, (req, res) => {
    var projectName = req.body.pjname;
    var status = "OPEN";
    var title = req.body.title;
    var description = req.body.description;
    var today = todayDate();

    Bts.create(

        { projectName: projectName, status: status, dateCreated: today, title: title, description: description },
        function (err, bts) {
            if (err) {
                console.log(err);
            } else {
                console.log(bts);
                res.redirect("/bugs");
            }
        }
    );
});


app.get("/bugs/new", isLoggedIn, (req, res) => {
    Project.find({}, (err, project) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/new.ejs", { Project: project });
        }
    });
});


app.get("/bugs/resolved", isLoggedIn, (req, res) => {
    Bts.find({ status: 'RESOLVED' }, (err, bugs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/resolved", { bugs: bugs });
        }
    });
});


app.get("/bugs/closed", isLoggedIn, (req, res) => {
    Bts.find({ status: 'CLOSED' }, (err, bugs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/closed", { bugs: bugs });
        }
    });
});


app.get("/bugs/assigned", isLoggedIn, (req, res) => {
    Bts.find({ status: 'ASSIGNED' }, (err, bugs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/assigned", { bugs: bugs });
        }
    });
});


app.get("/bugs/open", isLoggedIn, (req, res) => {

    Bts.find({ status: 'OPEN' }, (err, bugs) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/open", { bugs: bugs });
        }
    });
});


app.get("/bugs/:id", isLoggedIn, (req, res) => {
    Bts.findById(req.params.id).populate("comments").exec((err, Foundbug) => {
        if (err) {
            console.log(err);
        } else {
            res.render("bugs/show", { bug: Foundbug });
        }
    });
});


app.get("/error", (req, res) => {
    res.render("error");
})


app.get("/bugs/:id/comments/new", isLoggedIn, function (req, res) {

    Bts.findById(req.params.id, (err, bug) => {
        if (err) {
            res.redirect("/error");
            console.log(err);
        } else {
            res.render("comments/new", { bug: bug });
        }
    });
});


app.get("/contact", (req, res) => {
    res.render("contact");
});


app.post("/contact", (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var subject = req.body.subject;
    var message = req.body.message;
    var dateOfContact = todayDate();

    Contact.create({
        name: name, email: email, subject: subject,
        message: message,
        dateOfContact: dateOfContact
    }, (err, contact) => {
        if (err) {
            res.render("/error");
        } else {
            res.redirect("/bugs");
        }
    });
});


app.get("/contacts", (req, res) => {
    Contact.find({}, (err, contact) => {
        if (err) {
            res.render("/error");
            console.log(err);
        } else {
            res.render("ContactMessages/contacts", { contact: contact })
        }
    });
});


app.get("/contacts/:id", (req, res) => {
    Contact.findById(req.params.id, (err, FoundMessage) => {
        if (err) {
            console.log(err);
        } else {
            res.render("ContactMessages/show", { message: FoundMessage });
        }
    });
});


app.delete("/contacts/:id", isLoggedIn, (req, res) => {
    Contact.findByIdAndRemove(req.params.id, function (err) {
        if (err) {

        } else {
            res.redirect("/contacts");
        }

    });
});


app.post("/bugs/:id/comments", isLoggedIn, (req, res) => {
    Bts.findById(req.params.id, (err, bug) => {
        if (err) {
            console.log(err);
            res.redirect("/error");
        } else {
            var author = req.body.author;
            console.log(author);
            if (author == undefined) {
                author = req.user.username;
            }
            console.log(author);
            var comment = req.body.comment;
            Comment.create({ text: comment, author: author }, (err, comment) => {
                if (err) {
                    console.log(err)
                } else {
                    bug.comments.push(comment);
                    bug.save();
                    res.redirect("/bugs/" + bug._id);
                }
            });
        }
    });
});


app.get("/bugs/:id/edit", isLoggedIn, (req, res) => {
    Bts.findById(req.params.id, (err, bug) => {
        if (err) {
            res.redirect("/error");
            console.log(err);
        } else {
            res.render("bugs/edit", { bug: bug });
        }
    });
});


app.get("/bugs/:id/changeStatus", isLoggedIn, (req, res) => {

    Bts.findById(req.params.id, (err, bug) => {
        if (err) {
            res.redirect("/error");
            console.log(err);
        } else {
            res.render("bugs/changeStatus", { bug: bug });
        }
    });

});


app.put("/bugs/:id", isLoggedIn, (req, res) => {
    var projectName = req.body.pjname;
    var status = req.body.status;
    var title = req.body.title;
    var description = req.body.description;
    var today = todayDate();
    var dateSolved = "";
    var status = req.body.status;
    if (status == "CLOSED" || status == "RESOLVED") {
        dateSolved = todayDate();
    }
    var UpdatedBug = {
        projectName: projectName, status: status, dateCreated: today,
        title: title, description: description, dateSolved: dateSolved
    };

    Bts.findByIdAndUpdate(req.params.id, UpdatedBug, function (err, UpdatedBug) {
        if (err) {
            res.redirect("/error");
        } else {
            res.redirect("/bugs/");
        }
    });
});


app.put("/bugs/:id/changestatus", isLoggedIn, (req, res) => {
    var dateSolved = "";
    var status = req.body.status;
    if (status == "CLOSED" || status == "RESOLVED") {
        dateSolved = todayDate();
    }
    Bts.findById(req.params.id, (err, bug) => {
        if (err) {
            res.redirect("/error");
            console.log(err);
        } else {
            var UpdatedBug = {
                projectName: bug.projectName, status: status, dateCreated: todayDate(),
                title: bug.title, description: bug.description, dateSolved: dateSolved
            };
            Bts.findByIdAndUpdate(req.params.id, UpdatedBug, function (err, UpdatedBug) {

                if (err) {
                    res.redirect("/error");
                } else {
                    res.redirect("/bugs/");
                }
            });
        }
    });
});


app.delete("/bugs/:id", isLoggedIn, (req, res) => {
    Bts.findByIdAndRemove(req.params.id, function (err) {
        if (err) {

        } else {
            res.redirect("/bugs");
        }

    });
});


app.get("/signup", (req, res) => {
    res.render("signup");
});


app.get("/register", (req, res) => {
    res.render("signup");
});


app.post("/register", (req, res) => {
    var no = 0;

    var newUser = new User({
        FullName: req.body.name, username: req.body.username,
        mNumber: req.body.number, email: req.body.email, isAdmin: no, isTeamMember: no,workAssigned: "No"
    });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err.name);
            return res.render("signup");
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect("/bugs");
        })
    })
});


app.get("/login", (req, res) => {
    res.render("landing");
});


app.post("/login", passport.authenticate("local", {
    successRedirect: "/bugs",
    failureRedirect: "/login"
}),
    (req, res) => { console.log("Logged In") });


app.get("/logout", isLoggedIn, (req, res) => {
    req.session.destroy(function (err) {
        res.redirect('/bugs');
    });

});


app.get("/profile", isLoggedIn, (req, res) => {
    res.redirect("/user/" + req.user._id);
});


app.get("/projects", isLoggedIn, (req, res) => {
    Project.find({}, (err, project) => {
        if (err) {
            console.log(err);
        } else {
            res.render("projects/projects", { Project: project });
        }
    })
});


app.get("/projects/new", isLoggedIn, (req, res) => {
    res.render("projects/new");
});


app.post("/projects", isLoggedIn, (req, res) => {

    var projectName = req.body.pjname;
    var techStack = req.body.techStack;
    var projectDetails = req.body.description;
    var status = req.body.status;
    var dateAdded = todayDate();

    Project.create({
        projectName: projectName, techStack: techStack, projectDetails: projectDetails,
        status: status, dateAdded: dateAdded
    }, (err, comment) => {
        if (err) {
            console.log(err)
        } else {

            res.redirect("/projects");
        }
    });

});


app.get("/projects/:id", isLoggedIn, (req, res) => {
    var id = req.params.id;
    Project.findById({ _id: id }, (err, project) => {
        if (err) {
            res.redirect("/error");
        } else {
            res.render("projects/show", { project: project });
        }
    });

});


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}


app.get('*', (req, res) => {
    res.render("error");
});


app.listen(PORT, (req, res) => {
    console.log("The server started on Port 3000 go to http://localhost:3000/ to view the project ");
});
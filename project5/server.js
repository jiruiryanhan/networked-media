// library imports
const express = require("express"); // imports express
const multer = require("multer"); // imports multer -- handles file upload
const bodyParser = require("body-parser"); // imports body parser -- allows us to have a body in server request
const nedb = require("@seald-io/nedb");
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');


// *********************************************
// importing new cookie library
// *********************************************
const cookieParser = require("cookie-parser");

// *********************************************
// importing new authentication libraries
// *********************************************
const expressSession = require('express-session')
const nedbSessionStore = require('nedb-promises-session-store')
const bcrypt = require('bcrypt')



// instantiate express application
const app = express();
const server = createServer(app);
const io = new Server(server);

// more variable setups
const urlEncodedParser = bodyParser.urlencoded({ extended: true }); // set up body parser to parse request.body
const upload = multer({ dest: "public/uploads" }); // set up multer location to store files

// database setup
let database = new nedb({ filename: "database.txt", autoload: true });

// middleware setup for express application
app.use(express.static("public")); // set the default folder for any static files such as assets, css, html
app.use(urlEncodedParser); // attach body parser to app to parse request.body
app.set("view engine", "ejs"); // attach ejs as templating engine

// *********************************************
// tell the app to use the new cookie parser
// *********************************************
app.use(cookieParser('supersecret123'));

// *********************************************
// setting up middleware libraries for auth
// *********************************************
const nedbSessionInit = nedbSessionStore({
  connect: expressSession,
  filename: 'sessions.txt'
})
app.use(expressSession({
  store: nedbSessionInit,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000
  },
  secret: 'supersecret123'
}))

// share the middlewares of the session to the socketio 
const sessionMiddleware = expressSession({
  store: nedbSessionInit,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000
  },
  secret: 'supersecret123'
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, (err) => {
    if (err) {
      console.log('Session middleware error:', err);
      return next(err);
    }
    if (socket.request.session && socket.request.session.loggedInUser) {
      socket.user = socket.request.session.loggedInUser;
      next();
    } else {
      console.log('Socket.IO authentication failed: No logged-in user');
      next(new Error('Authentication error'));
    }
  });
});


let userdb = new nedb({
  filename: 'userdb.txt',
  autoload: true
})

// creating custom middleware
function requiresAuthentication(req, res, next){
  if (req.session.loggedInUser){
    next()
  } else {
    res.redirect('login?err=userNotLoggedIn')
  }
}

// default route
app.get("/", requiresAuthentication, (request, response) => {
    
  // variable that stores how many visits the page has had
  let newVisits = 1

  console.log(request.cookies)
  
  if(request.cookies.visits){
    // convert string from the cookie into a number
    newVisits = parseInt(request.cookies.visits) + 1
    // the date is an arbitrary date 100 years in the future, converted to ms
    response.cookie("visits", newVisits, {expires: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)})
  } else{
    // if the cookie does not exist yet
    response.cookie("visits", newVisits, {expires: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)})
  }

  // display all the collectibles the user has. 
  userdb.findOne({ username: request.session.loggedInUser }, (err, user) => {
    response.render('index.ejs', {
      visitsToSite: newVisits,
      collectibles: user.collectibles || { repeatable: { spoton: 0, ballpark: 0, rough: 0 }, unique: [] },
      fullname: user.fullname || ''
    });
  });


});

// Socket.IO 
io.on('connection', (socket) => {
  console.log('a user connected');  
  socket.on('disconnect', ()=> console.log('client disconnected'))

  // update the repeatable collectibles
  socket.on('update-repeatable', (data) => {
    console.log('event called')
    userdb.findOne({ username: socket.request.session.loggedInUser }, (err, user) => {
        // if the user not exist or there's an error, do not continue
      if (err || !user) return;
      console.log("user found")

      // retrive or define the collectibles 
      const collectibles = user.collectibles || { repeatable: { spoton: 0, ballpark: 0, rough: 0 }, unique: [] }

      // increment the repeatable count
      collectibles.repeatable[data.type] = (collectibles.repeatable[data.type] || 0) + 1;

      userdb.update(
        { username: socket.request.session.loggedInUser },
        { $set: { collectibles } },
        {},
        (err, numUpdated) => {
          if (err) {
            console.log('Error updating collectibles:', err);
            socket.emit('error', { message: 'Failed to update collectibles' });
          } else {
            console.log(`Updated ${numUpdated} user(s) with new collectibles:`, collectibles);
            socket.emit('collectibles-updated', collectibles);
          }
        }
      );
    })
  })

  
});



// Endpoint to serve the variable
let serverVariable = 0;

// setInterval(() => {
//   if (serverVariable < 5) {
//     serverVariable += 0.1;
//   } else {
//     serverVariable = 0;
//     // Unlock repeatable collectible for all logged-in users
//     io.emit('unlock-repeatable', { type: 'ballpark' });  
//   }
//   io.emit('update-variable', serverVariable);
// }, 1000); // 1000ms = 1 second

app.get('/data', (req, res) => {
    res.json({ value: serverVariable });
});


app.post('/unlock-unique', requiresAuthentication, (req, res) => {

  // get the unique collectibleId
  const collectibleId = parseInt(req.body.collectibleId);

  // find the user through username
  userdb.findOne({ username: req.session.loggedInUser }, (err, user) => {  
    const collectibles = user.collectibles || { repeatable: { spoton: 0, ballpark: 0, rough: 0 }, unique: [] };    // retrive or define the collectibles
    if (!collectibles.unique.includes(collectibleId)) {
      collectibles.unique.push(collectibleId);  // add the unique collectible into the unique array
      userdb.update(
        { username: req.session.loggedInUser },
        { $set: { collectibles } },
        {},
        (err, numUpdated) => {
          res.json({ collectibles });
        }
      );
    } else {
      res.json({ collectibles }); // if already unlocked
    }
  });

})


// get user's collectibles
app.get('/collectibles', requiresAuthentication, (req, res) => {

  // find the user by username
  userdb.findOne({ username: req.session.loggedInUser }, (err, user) => {
    res.json({ collectibles: user.collectibles || { repeatable: { spoton: 0, ballpark: 0, rough: 0 }, unique: [] } });
  });
});


// *********************************************
// adding rendering for new files
// *********************************************
app.get('/register', (req, res)=>{
  res.render('register.ejs')
})
app.get('/login', (req, res)=>{
  res.render('login.ejs')
})

app.get('/logout', requiresAuthentication,(req,res)=>{
  delete req.session.loggedInUser
  res.redirect('/login')
})

app.post('/signup', upload.single("profilePicture"), (req, res)=>{
  // first thing is to encrypt the password
  let hashedPassword = bcrypt.hashSync(req.body.password, 10)
""
  // the data to be added from the form into the user database
  let newUser = {
    username: req.body.username,
    fullname: req.body.fullname,
    password: hashedPassword, // encrptyed password will be stored in db
    collectibles: {repeatable: { spoton: 0, ballpark: 0, rough: 0 }, unique: []} // the achievements the user can unlock
  }

  userdb.insert(newUser, (err, insertedUser)=>{
    res.redirect('/login')
  })
})

app.post('/authenticate', (req, res)=>{
  let data = {
    username: req.body.username,
    password: req.body.password
  }

  let searchQuery = {
    username: data.username
  }

  userdb.findOne(searchQuery, (err, user)=>{
    if(err || user == null){
      // if the user not found, redirect to login
      res.redirect('/login')
    } else{
      // otherwise user successfully found
      let encPass = user.password
      if(bcrypt.compareSync(data.password, encPass)){
        let session = req.session
        session.loggedInUser = data.username
        res.redirect('/')
      } else{
        res.redirect('/login')
      }
    }
  })
})

server.listen(6001, () => {
  // you can access your dev code via one of two URLs you can copy into the browser
  // http://127.0.0.1:6001/
  // http://localhost:6001/
  console.log("server started on port http://198.199.80.129:6001/");
});
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var profile = require('./routes/profile');
var dataSharing = require('./routes/dataSharing');
var userAccessBehaviorTracking = require('./routes/userAccessBehaviorTracking')
var regAccessBehaviorTracking = require('./routes/regAccessBehaviorTracking')
var metamask_connect = require('./routes/metamask-connect');

var passport = require('passport');
var cookieSession = require('cookie-session');
var session = require('express-session');
var LdapStrategy = require('passport-ldapauth');
var ssha = require('node-ssha256');
var flash = require("connect-flash");
var fs = require('fs');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
var OPTS = config.ldap;

var app = express();

// db setup
const db = require("./models");

// If you don't want to drop, leave empty.
// db.sequelize.sync();
db.sequelize.sync({ force: true }).then( () => {
    console.log("Drop and re-sync db.")
});
 
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret:'secret',
    saveUninitialized: true,
    resave: true
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/contracts', express.static(__dirname + '/build/contracts'));

app.use('/', routes);
app.use('/users', users);
app.use('/profile', profile);
app.use('/metamask-connect', metamask_connect);
app.use('/dataSharing', dataSharing);
app.use('/userAccessBehaviorTracking', userAccessBehaviorTracking);
app.use('/regAccessBehaviorTracking', regAccessBehaviorTracking);

// api route
require("./routes/token.routes")(app);
require("./routes/user.routes")(app);
require("./routes/invoice.routes")(app);
require("./routes/accessBehavior.routes")(app);
require("./routes/test.routes")(app);

passport.use(new LdapStrategy(OPTS));

passport.serializeUser(function(user, done) {
    console.log(user.dn);
    delete user['userpassword'];
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    // console.log("de");
    // console.log(user);
    done(null, user);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

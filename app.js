const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const app = express();

const port = 3000;
const dbURI = "<MONGO DB SERVER URI>";
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.log(err));


app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,    
  cookie: {
    httpOnly: true,   
    maxAge: 1000 * 60 * 60 * 24, 
    secure: false  
},
  store: MongoStore.create({
    mongoUrl: dbURI 
  })
}));
app.use(cookieParser());

app.use(flash());

app.use((req, res, next) => {
  res.locals.cookies = req.cookies;
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user; 
  res.locals.user = req.session.user; 
  next();
});

const userRoutes = require('./routes/users-route');
app.use('/users', userRoutes);

const itemRoutes = require('./routes/items-route');
app.use('/items', itemRoutes); 

const offersRoutes = require('./routes/offers-route');
app.use('/offers',offersRoutes);

app.get('/', (req, res) => {
  res.render('index');
});



// Error handling
app.use((req, res, next) => {
  if (!req.route) {
    const error = new Error('The page you requested could not be found.');
    error.status = 404;
    next(error);
  } else {
    next();
  }
});

// Unified error handling middleware
app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    // Handle validation errors
    const validationErrors = Object.values(error.errors).map(err => err.message);
    res.status(400).render('error', {
      error: {
        status: 400,
        message: 'Validation Error: ' + validationErrors.join(', '),
      }
    });
  } else {
    // Handle general errors
    res.status(error.status || 500).render('error', {
      error: {
        status: error.status || 500,
        message: error.message, // Displaying the actual error message
      }
    });
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

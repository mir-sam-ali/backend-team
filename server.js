const express = require('express');
const cors = require('cors');
const mongoose =  require('mongoose');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const Event = require('./models/Event');

// const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended:true,}));
app.set('view engine','ejs');
app.set('useFindAndModify',false);

const uri = "mongodb+srv://heads:heads@cluster0-v6kuo.mongodb.net/techsite?retryWrites=true&w=majority";
// for testing
// const uri ="mongodb://127.0.0.1:27017/database";

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

let gfs;
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
  gfs = new mongoose.mongo.GridFSBucket(connection.db, {bucketName: "uploads"});
});

const userRouter = require('./routes/users');
const gformRouter = require('./routes/gform');
const eventRouter = require('./routes/events');
const registerRouter = require('./routes/register');

app.get('/',(req,res)=>{
  res.render('index');
})

app.get('/profile',(req,res)=>{
  res.render('profile',{id:req.query.id});
})
// app.use(morgan('tiny'));
app.use('/users',userRouter);
app.use('/gform',gformRouter);
app.use('/events',eventRouter);
app.use('/register',registerRouter);

app.listen(port,()=>{
    console.log(`listening on port : ${port}`);
});


const storage = new GridFsStorage({
  url: uri,
  file: (req, file) => {
      return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
              if (err) {
                  return reject(err);
              }
              const filename = buf.toString('hex') + path.extname(file.originalname);
              const fileInfo = {
                  filename: filename,
                  bucketName: 'uploads'
              };
              resolve(fileInfo);
          });
      });
  }
});

const upload = multer({ storage });

//invoked from form to upload
app.post('/users/profile/image/upload/:id', upload.single('file'),(req, res) => {
  const id = req.params.id;
  // Sending back file name to server
  res.redirect(`/users/profile/image/update?id=${id}&?url=${req.file.filename}`);
  // res.json({file:req.file});
});


// returns an image stream to show as prof pic    || todo add it to the ejs once the server is made online
app.get("/users/profile/image/:filename", (req, res) => {
  const file = gfs
    .find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist"
        });
      }
      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

//delete request as per documentation to clear all chunks probably need to preserve the object id
app.post("/users/profile/image/del/:img", (req, res) => {
  gfs.delete(new mongoose.Types.ObjectId(req.params.img), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.status(200);
  });
});

app.post('/users/add_event/:club_head_id/add_event/:club_name/add',upload.single('poster'),(req,res)=>{
  const club_name = req.params.club_name;
  const club_head_id = req.params.club_head_id;
  const event_name = req.body['event_name'];
  const event_date = req.body['event_date'];
  const event_venue = req.body['event_venue'];
  const categories = req.body['categories'];
  const description = req.body['description'];
  const speaker = req.body['speaker'];

  const event = new Event({
      name:event_name,
      venue:event_venue,
      date:event_date,
      description:description,
      poster_url:`/events/posters/${req.file.filename}`,
      owner:new mongoose.Types.ObjectId(club_head_id),
      categories:categories,
      speaker:speaker,
      
  });

  event.save((err,event) => {
      if (err) throw err;
      console.log(event);
      
  });

  Event.findById(event._id)
  .populate({
    path: 'owner',
    model: 'Users'
  })
  .exec((err,event)=>{
      if (err) throw err;
      console.log(event);   
  })

  res.send('success')
  
});

//returns poster
app.get('/events/posters/:poster',(req,res)=>{
      const filename = req.params.poster;

      const file = gfs
      .find({
        filename: req.params.poster
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) {
          return res.status(404).json({
            err: "no files exist"
          });
        }
        gfs.openDownloadStreamByName(req.params.poster).pipe(res);
      });

})
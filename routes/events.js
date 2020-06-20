const router = require('express').Router()
const eventsModel = require('../models/Event.model')
const upload = require('../upload');

// route for rendering event creation page
router.route('/create/').get((req, res) => {
  res.render('add_event', { club_head_id: user._id })
})

//   route to create event
router.route('/create/').post( upload.single('poster'), (req, res) => {
    let poster_url
    if (req.file == undefined) {
      poster_url = ' '
    } else {
      poster_url = `${req.file.filename}`
    }
  
    const event = new eventsModel({
      name: req.body.event_name + '',
      venue: req.body.event_venue,
      date: req.body.event_date,
      description: req.body.description,
      poster_url: poster_url, // url to find poster of the event
      owner: req.session._id,
      categories: req.body.categories,
      speaker: req.body.speaker
  
    })
  
    event.save((err, event) => { // saving the event in database
      if (err) {
        res.json(err)
      } else {
        res.redirect('/users/events/retrieve/')
      }
    })
    // let headid = req.params.club_head_id;
  })
  
// route for viewing all events
router.route('/view_all/').get((req, res) => {
    eventsModel.find({ owner: req.session._id })
      .then(events => {
      // res.json(events)
        res.render('event_view', { events: events, moment: moment })
      }).catch((err) => {
        res.json('Error: ' + err)
      })
})
  
// route for rendering details of an event
  router.route('/details/:id').get((req, res) => {
    const id = req.params.id
    eventsModel.find({ _id: id })
      .then(events => {
      // res.json(events)
        res.render('event_details', { events: events, moment: moment })
      }).catch((err) => {
        res.json('Error: ' + err)
      })
})
// route for rendering update event page
router.route('/update/:id').get((req,res)=>{
    const id = req.params.id
    eventsModel.findById(id)
    .then(event=>{
        res.render('update_event',{event:event,moment:moment})
    }).catch(err=>{
        res.json(err)
    })
})

// route to update the event
router.route('/update/:id').post( upload.single('poster'), (req, res) => {
    const id = req.params.id;
    var evsum;
    if (req.file == undefined) {
        ev={
            'name':req.body.event_name,
            'venue':req.body.event_venue,
            'date':req.body.event_date,
            'description':req.body.description,
            'categories':req.body.categories
        }
    } else {
        ev={
            'name':req.body.event_name,
            'venue':req.body.event_venue,
            'date':req.body.event_date,
            'description':req.body.description,
            'poster_url':`${req.file.filename}`,
            'categories':req.body.categories
        }
    }
    eventsModel.findByIdAndUpdate(id,ev)
    .then((event)=>{
        res.redirect("/users/events/retrieve");
    });
});

// route to delete the event
router.route('/delete/:id').get((req,res)=>{
    const id = req.params.id
    eventsModel.findByIdAndDelete(id)
    .then(()=>{
        var club_head_id = req.session._id
        eventsModel.find({ owner: club_head_id })
        .then(events => {
        // res.json(events)
            res.render('event_view', { events: events, moment: moment })
        }).catch((err) => {
        res.json('Error: ' + err)
        })
    }).catch(err=>{
        res.json(err)
    })
})


//routes for collecting events based on month(1-12) and populating them
router.route('/:month').get((req,res) => {
    month = req.params.month
    const resEvents = new Array()

    eventsModel.find().then((events) => {
        events.forEach(event => {
            if(event.filterByMonth(month)){
                resEvents.push(event)
            }
        })

        res.send(resEvents)
    }).catch((e) => {
        res.status(400).send(e)
    })

})


module.exports = router;

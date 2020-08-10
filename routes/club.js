const router = require('express').Router()
const clubModel = require('../models/Club.model')
const clubHeadsModel = require('../models/ClubHead.model')
const clubMemberModel = require('../models/ClubMember.model')
const blogModel = require('../models/Blog.model')
const {upload, uploadf}= require('../db/upload')
const adminAuth = require('../middleware/adminAuth');
const clubAuth = require('../middleware/clubAuth')

// for rendering the create club page
router.route('/create/').get(adminAuth, (req, res) => {
    res.render('create_club', { alerts: req.flash('error'),page_name:"clubs"})
})

// route to create the club
router.route('/create').post(adminAuth, (req, res) => {
  clubHeadsModel.findOne({email_id:req.body.email_id})
  .then((club_head)=>{
    if(!club_head){
      throw new Error()
    }
    var club = new clubModel({
      name: ((club_head.club_name).toUpperCase()),
      head: club_head._id,
    })
    club.save((err,club)=>{
      if(err){
        req.flash("error",err.message)
    res.redirect('/club/view_all')
      }else{
        res.redirect('/club/view_all')
      }
    })
  }).catch((e) => {
    req.flash("error",['Club head must exist with given email & Club name shouldnt aready exist !!!'])
    res.redirect('/club/view_all')
  })
})

// for rendering the club update page
router.route('/update').get(clubAuth, async (req, res) => {
    try{
      const owner = req.user
      const club = await clubModel.findOne({head: owner})

      if(!club){
        throw new Error()
      }

      res.render('update_club', { alerts: req.flash('error'),club,page_name:'update_club'})
    }catch(e){
      req.flash("error",['No club has been assigned to the logged in club head by admin'])
      res.redirect('/club/view_all')
    }
    
})

// route to update the club details
router.route('/update/').post(clubAuth, upload.single('logo') ,async (req, res) => {
    const owner = req.user
    if (req.file == undefined) {
      var change = {
        description: req.body.description,
        resources:req.body.resources,
        github: req.body.github,
        linkedin: req.body.linkedin,
        instagram: req.body.instagram,
        youtube: req.body.youtube,
        facebook: req.body.facebook
      }
    } else {
      var change = {
        description: req.body.description,
        resources:req.body.resources,
        logo_url: req.file.filename,
        github: req.body.github,
        linkedin: req.body.linkedin,
        instagram: req.body.instagram,
        youtube: req.body.youtube,
        facebook: req.body.facebook
      }
    }
    let club;
    let id;
    try {
      club = await clubModel.findOne({head: owner})
      id = club._id
      await clubModel.findByIdAndUpdate(id,change)
      res.redirect(307, '/club_head/profile')
    } catch (error) {
      req.flash("error",error.message)
      return res.redirect('/club_head/profile')
    }
})

// route to delete club
router.route('/delete/:id').delete(adminAuth, (req, res) => { 
    const club = req.body.club_name
  
    clubModel.deleteMany({ name: club }, (err) => {
      console.error.bind(console, 'not deleted')
    })
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(club)
})

// for rendering view page of all clubs
router.route('/view_all').get(adminAuth, (req, res) => {
    clubModel.find()
      .then(clubs => {
        res.render('view_clubs', { alerts: req.flash('error'),
          clubs: clubs, page_name:"clubs"
        })
      }).catch((err) => {
        req.flash("error",err.message)
        res.redirect('/admin/profile')
      })
})

// for rendering details of specific club
router.route('/details/:id').get(adminAuth, (req, res) => {
    const club_id = req.params.id
    clubModel.findById(club_id)
    .then(club => {
      clubHeadsModel.findById(club.head)
      .then(club_head=>{
        res.render('details_club', { alerts: req.flash('error'),club_head:club_head,club:club, page_name:"clubs"})
      }).catch(err=>{
        req.flash("error",err.message)
    res.redirect('/club/view_all')
      })
    }).catch(err=>{
      req.flash("error",err.message)
    res.redirect('/club/view_all')
    })
})

// for rendering the reset page
router.route('/reset/:id').get(adminAuth, (req,res)=>{
  const club_id = req.params.id
  res.render('reset_club', { alerts: req.flash('error'),club_id:club_id, page_name:"clubs"})
})

// route to reset any club
router.route('/reset/:id').post(adminAuth, (req,res)=>{
  const club_id = req.params.id
  const email_id = req.body.email_id
  
  clubHeadsModel.findOne({email_id:email_id},(err,club_head)=>{
    clubModel.findByIdAndUpdate(club_id,{head:club_head._id})
    .then(()=>{
      res.redirect('/club/view_all')
    }).catch(err=>{
      req.flash("error",err.message)
    res.redirect('/club/view_all')
    })
  })
})

module.exports = router

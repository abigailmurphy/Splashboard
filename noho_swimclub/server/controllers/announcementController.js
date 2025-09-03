const User = require("../models/user");
const Announcement = require("../models/announcement");


module.exports = {
  //Fetch all jobs
  index: (req, res, next) => {
    Announcement.find()
      .then((announcement) => {
        res.locals.announcement = announcement;
        next();
      })
      .catch((error) => {
        console.log(`Error fetching announcements: ${error.message}`);
        next(error);
      });
  },
  //render view for displaying all jobs
  indexView: (req, res) => {
    if(res.locals.loggedIn){
      const currentUser = res.locals.currentUser;
      let userAdmin = currentUser.isAdmin;
      if(userAdmin){
        res.render("announcements/indexAdmin");
      }
      else{
        res.render("announcements/index");
      }
    }else{
        res.render("announcements/index");
    }
    
  },
  // Render form for creating new job
  new: (req, res) => {
    if(res.locals.loggedIn){
      res.render("announcements/new");
    }else{
      req.flash("error", "Please sign in to create an announcement.");
      res.redirect("/announcements");
    }
    
  },
  // Execute creation of new job
  create: (req, res, next) => {
    if (req.skip) {
      next();
      return;
    }
    if(!res.locals.loggedIn){
      req.flash("error", "Please sign in to create an announcement.");
      res.redirect("/announcements");
    }
    // Gather parameters from form body
    const announceParams = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      date: req.body.date,
    };

    Announcement.create(announceParams)
    .then((announcement) => {
      req.flash('success', 'Announcement posted successfully.');
      res.locals.redirect = '/announcements';
      res.locals.announcement = announcement;
      next();
    })
    .catch((error) => {
      console.log(`Error saving announcement: ${error.message}`);
      next(error);
    });


  },
  // Redirect
  redirectView: (req, res, next) => {
    let redirectPath = res.locals.redirect;
    if (redirectPath) res.redirect(redirectPath);
    else next();
  },
  
  //take to edit form
  edit: (req, res, next) => {
    if(res.locals.loggedIn){
      let announcementId = req.params.id;
      Announcement.findById(announcementId)
        .then((announcement) => {
          res.render("announcements/edit", {
            announcement: announcement,
          });
        })
        .catch((error) => {
          console.log(`Error fetching announcement by ID: ${error.message}`);
          next(error);
        });

    }else{
      req.flash("error", "Please sign in to edit an announcement.");
      res.redirect("/announcements");

    }
    
  },
  //once at form and form completed, use this to update body
  update: (req, res, next) => {
    if(!res.locals.loggedIn){
      req.flash("error", "Please sign in to update an announcement.");
      res.redirect("/announcements");
    }
    let announcementId = req.params.id,
        announcementParams = {
            title: req.body.title,
            description: req.body.description, 
        
      };
      
    Announcement.findByIdAndUpdate(announcementId, {
      $set: announcementParams,
    })
      .then((announcement) => {
        req.flash('success', 'Announcement updated successfully.');
        res.locals.redirect = `/announcements`;
        res.locals.announcement = announcement;
        next();
        return;
      })
      .catch((error) => {
        console.log(`Error updating announcement by ID: ${error.message}`);
        next(error);
      });
  },
  //delete announcement
  delete: (req, res, next) => {
    let announcementId = req.params.id;
    Announcement.findOneAndDelete({_id: announcementId})
      .then(() => {
        req.flash('success', 'Announcement deleted successfully.');
        res.locals.redirect = "/announcements";
        next();
      })
      .catch((error) => {
        console.log(`Error deleting announcement by ID: ${error.message}`);
        next();
      });
  },

  validate: (req, res, next) => {
    req.check("title", "Title cannot be empty").notEmpty();
    req.check("description", "Description cannot be empty").notEmpty();

    req.getValidationResult().then((error) => {
      if (!error.isEmpty()) {
        let messages = error.array().map((e) => e.msg);
        req.skip = true;
        req.flash("error", messages.join(" and "));
        res.locals.redirect = "/announcements/new";
        next();
      } else {
        next();
      }
    });
  },
};


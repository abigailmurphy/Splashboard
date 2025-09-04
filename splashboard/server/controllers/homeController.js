const axios = require('axios');


module.exports ={
    //route to home
    respondHome: (req,res) => {
      res.render("index");
    },
    //route to about
    respondContact: (req,res) =>{
      res.render("contact");
    },
    //route to events
    //handle css
    serveCss: (req,res) => {
      res.sendFile('/public/css/styles.css');
    },
    serveImage: (req,res) => {
      const imageName = req.params.imageName; // Extract the image name from the URL
      const imagePath = '/public/images/' + imageName; // Construct the image path
      res.sendFile(imagePath);
    },
   
   // chat: (req,res) => {
    //  res.render("chat");
   // }
  
  
  }
  
    
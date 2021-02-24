const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );
    // Create user
  app.post("/api/auth/signin", controller.signin);

    // Get all user
    app.get("/api/auth/show", controller.findAll);
  
  //Get user by id
  app.get("/api/auth/getUserById/:id", controller.findOne);
  
  // Update user
  app.put("/api/auth/update/:id", controller.update);

  // reuest friend
  app.post("/api/auth/friendReq/:sender/:reciever",controller.friendRequest)

    // accept User
  app.post("/api/auth/friendReq/:currentUserID/:requesterID/accept",controller.acceptfriendRequest)

    // decline user
  app.post("/api/auth/friendReq/:currentUserID/:requesterID/decline",controller.declineRequest)

    // get friends
  app.get("/api/auth/friendReq/:currentUserID/friends",controller.getFriends)

    // get requests
    app.get("/api/auth/friendReq/:currentUserID/requests",controller.getResquests)
  
  


  
};

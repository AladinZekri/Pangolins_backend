const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { user } = require("../models");

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    age:req.body.age,
    famille:req.body.famille,
    race:req.body.race,
    nourriture:req.body.nourriture,
    friends:req.body.friends,
    
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

// get user by id
exports.findOne = (req, res) => {
  const id = req.params.id;

  user.findById(id)
    .then(data => {
      if (!data)
        res.status(404).send({ message: "Not found Tutorial with id " + id });
      else res.send(data);
    })
    .catch(err => {
      res
        .status(500)
        .send({ message: "Error retrieving user with id=" + id });
    });
};


// Retrieve all users from the database.
exports.findAll = (req, res) => {
  const username = req.query.username;
  var condition = username ? { username: { $regex: new RegExp(username), $options: "i" } } : {};

  user.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving users."
      });
    });
};



// Modifier 
exports.update = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }

  const id = req.params.id;

  user.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found!`
        });
      } else res.send({ message: "Tutorial was updated successfully." });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Tutorial with id=" + id
      });
    });
};



// login
exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        age:user.age,
        famille:user.famille,
        race:user.race,
        nourriture:user.nourriture,
        friends:user.friends,
        roles: authorities,
        accessToken: token
      });
    });
};


// send friends request
exports.friendRequest = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }
  let sender;
  let reciever;

  const senderID = req.params.sender;
  const recieverID = req.params.reciever;

  user.findById(senderID).then(data=>{
    sender=data;
    
    //add request to requestList
  if(sender.friendRequestsSent){
    // check requst existance
    if(!sender.friendRequestsSent.includes(recieverID)){
      sender.friendRequestsSent.push(recieverID);
    }
    
  }else{
    sender['friendRequestsSent']=recieverID;
  }
  //update request list in data base
  user.findByIdAndUpdate(senderID, sender, { useFindAndModify: false })
  .then(data => {
    if (!data) {
      res.status(404).send({
        message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
      });
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Error updating Tutorial with id=" 
    });
  });

  });

  user.findById(recieverID).then(data=>{
    reciever=data;
    
  if(reciever.friendRequestsRecieved){
    if(!reciever.friendRequestsRecieved.includes(senderID)){
      reciever.friendRequestsRecieved.push(senderID);
    }
      
  }else{
    sender['friendRequestsRecieved']=recieverID;
  }
  user.findByIdAndUpdate(recieverID, reciever, { useFindAndModify: false })
  .then(data => {
    if (!data) {
      res.status(404).send({
        message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
      });
    }
  })
  .catch(err => {
    res.status(500).send({
      message: "Error updating Tutorial with id=" 
    });
  });

  });

res.status(200).send({ message: "Tutorial was updated successfully." });

};


// accept decline friend request
exports.acceptfriendRequest = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }

  let currentUserID=req.params.currentUserID;
  let requesterID=req.params.requesterID;
  let currentUser;
  let requetingUser;

  // add friends to connected user
  user.findById(currentUserID).then(data=>{
    currentUser=data;
    const index = currentUser.friendRequestsRecieved.indexOf(requesterID);
    currentUser.friendRequestsRecieved.splice(index,1);
    

    if(currentUser.friends){
      if(!currentUser.friends.includes(requesterID)){
        currentUser.friends.push(requesterID);
      }       
    }else{
      sender['friends']=requesterID;
    }

    user.findByIdAndUpdate(currentUserID, currentUser, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Tutorial with id=" 
      });
    });



  })
  // add friends to requesting user
  user.findById(requesterID).then(data=>{
    requetingUser=data;
    const index = requetingUser.friendRequestsSent.indexOf(currentUserID);
    requetingUser.friendRequestsSent.splice(index,1);
    

    if(requetingUser.friends){
      if(!requetingUser.friends.includes(currentUserID)){
        requetingUser.friends.push(currentUserID);
      }       
    }else{
      sender['friends']=currentUserID;
    }

    user.findByIdAndUpdate(requesterID, requetingUser, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Tutorial with id=" 
      });
    });



  })

  


  

res.status(200).send({ message: "Tutorial was updated successfully." });

};


// accept decline friend request
exports.declineRequest = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!"
    });
  }

  let currentUserID=req.params.currentUserID;
  let requesterID=req.params.requesterID;
  let currentUser;
  let requetingUser;

  // add friends to connected user
  user.findById(currentUserID).then(data=>{
    currentUser=data;
    const index = currentUser.friendRequestsRecieved.indexOf(requesterID);
    currentUser.friendRequestsRecieved.splice(index,1);

    user.findByIdAndUpdate(currentUserID, currentUser, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Tutorial with id=" 
      });
    });



  })
  // add friends to requesting user
  user.findById(requesterID).then(data=>{
    requetingUser=data;
    const index = requetingUser.friendRequestsSent.indexOf(currentUserID);
    requetingUser.friendRequestsSent.splice(index,1);

    user.findByIdAndUpdate(requesterID, requetingUser, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Tutorial with . Maybe Tutorial was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Tutorial with id=" 
      });
    });



  })
res.status(200).send({ message: "Tutorial was updated successfully." });

};


// get friends
exports.getFriends = (req, res) => {


  let currentUserID=req.params.currentUserID;
  let currentUser;
  let friendListID=[];
  let friendListToReturn=[];
 

  // add friends to connected user
  user.findById(currentUserID).then(userRes=>{
    currentUser=userRes;
    friendListID=currentUser.friends;
    if(friendListID && friendListID.length>0){

      for(let i=0;i<friendListID.length;i++){
        user.findById(friendListID[i]).then(data=>{
          friendListToReturn.push(data);

          if(friendListToReturn.length==friendListID.length){
            res.status(200).send(friendListToReturn);
          }
        })
      }   
    }
   
  });


};





// get requests
exports.getResquests = (req, res) => {


  let currentUserID=req.params.currentUserID;
  let currentUser;
  let requestsList=[];
  let friendListToReturn=[];
 

  // add friends to connected user
  user.findById(currentUserID).then(userRes=>{
    currentUser=userRes;
    requestsList=currentUser.friendRequestsRecieved;
    if(requestsList && requestsList.length>0){

      for(let i=0;i<requestsList.length;i++){
        user.findById(requestsList[i]).then(data=>{
          friendListToReturn.push(data);

          if(friendListToReturn.length==requestsList.length){
            res.status(200).send(friendListToReturn);
          }
        })
      }   
    }
   
  });

};



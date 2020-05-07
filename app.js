//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// let customListName = "";

// mongoose.connect("mongodb://localhost:27017/fruitsDB", { useUnifiedTopology: true,  useNewUrlParser: true });
mongoose.connect("mongodb+srv://admin-spurgeon:Test123@cluster0-tetdl.mongodb.net/todoListDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Check Your data entry, You must enter an item."]
  }
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome To Your ToDo List"
});

const item2 = new Item({
  name: "Hit + to add a new Item"
});

const item3 = new Item({
  name: "<--- Hit This to delete an item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  Item.find((err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Inserted The Documents into Items Collection in ItemsDB Successfully");
        }
      });
      res.redirect("/");
    } else {

      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const itemDetails = new Item({
    name: itemName
  });
  if (listName === "Today") {
    itemDetails.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, (err, foundList) => {
      foundList.items.push(itemDetails);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


app.get("/about", function(req, res) {
  res.render("about");
});

app.post("/delete", (req, res) => {
  const checkboxIdentifier = req.body.hiddenInput;
  if (checkboxIdentifier === "Today") {
    // console.log(req.body.checkbox);
    // Item.deleteOne({_id:req.body.checkbox}, function(err) {
    //   if(err) {
    //     console.log(err);
    //   } else {
    //     console.log("Successfully deleted from the database.");
    //     res.redirect("/");
    //   }
    // });

    Item.findByIdAndRemove(req.body.checkbox, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted Fro DB");
        res.redirect("/");
      }
    });
  } else {

    //syntax for findOneAndUpdate
    // Module.collection.findOneAndUpdate({condition},{update},callback);

    //syntax to delete an array item using $pull
    //{$pull : {arrayToPull: {condition to find item}}}

    List.findOneAndUpdate({
      name: checkboxIdentifier
    }, {
      $pull: {
        items: {
          _id: req.body.checkbox
        }
      }
    }, (err, foundList) => {
      res.redirect("/" + checkboxIdentifier);
    });

    // List.findOne({name:checkboxIdentifier}, (err,foundList)=> {
    //   if(!err) {
    //       let indexValue = 0;
    //       // console.log(foundList);
    //       foundList.items.forEach((listItem,i) => {
    //         if(listItem._id == req.body.checkbox) {
    //           indexValue = i;
    //         }
    //       });
    //       foundList.items.splice(indexValue,1);
    //       foundList.save();
    //       res.redirect("/"+checkboxIdentifier);
    //   }
    // });
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        console.log("Does n't exists");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});

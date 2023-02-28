const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.set("strictQuery", false);
mongoose.connect(
  `mongodb+srv://${process.env.DB_LOGIN}:${process.env.DB_PSWD}@cluster0.psapdlz.mongodb.net/todolistDB`,
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Data added to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", toDoList: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  let listName = req.body.list;
  let newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", function (req, res) {
  let checkedItemId = req.body.checkbox;
  let listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/:listType", function (req, res) {
  let listName = _.capitalize(req.params.listType);
  List.findOne({ name: listName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        let list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${listName}`);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          toDoList: foundList.items,
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server running on port 3000")
);

//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const lodash = require("lodash")
const mongoose = require("mongoose")
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB',{useNewUrlParser:true,useUnifiedTopology:true})
const db = mongoose.connection

db.on('error',(err) => {
    console.log(err)
})

db.once('open', ()=>{
    console.log('Database Connection established')
})

const day = date.getDate();

const itemsSchema = new mongoose.Schema({
  name:String
})

const Item = mongoose.model("Item",itemsSchema)

const item1 = new Item({
  name:"Welcome to the todo list"
})

const item2 = new Item({
  name:"Hit the + button to add a new list"
})

const item3 = new Item({
  name:"<-- hit this to delete the item"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema)







const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", function(req, res) {


  Item.find()
  .then(foundItems =>{
    if (foundItems.length === 0){
      Item.insertMany(defaultItems)
      res.redirect("/")
    }else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  })
  .catch(err =>{
    console.log(err)
  })

// const day = date.getDate();

});

app.get("/:customListName",function(req,res){
  const customListName = lodash.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then((foundList)=>{
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName)
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch(err =>{
      console.log(err)
    })

  
})


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === day){
    item.save()
    res.redirect("/")
  }else{
    List.findOne({name: listName})
      .then((foundList) =>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName)
      })
      .catch(err =>{
        console.log(err)
      })

  }
  
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete",function(req,res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day){
    Item.deleteOne({_id:checkedItemID})
    .then(()=>{
      res.redirect("/")
    })
    .catch(err =>{
      console.log(err)
    })
  }else{
   List.updateOne({name:listName},{$pull:{items:{_id:checkedItemID}}})
    .then(()=>{
      res.redirect("/"+listName)
    })
    .catch(err =>{
      console.log(err)
    })
  }
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

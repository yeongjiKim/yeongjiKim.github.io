var express =require('express');
var mysql=require('mysql')

var con=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'0000',
    port:3308,
    database:'instagram'
});

con.connect(function(err){
    if(!err){
        console.log("Database is connected\n");
    }
    else{
        console.log("Database is not Connected\n");
    }
});

module.exports=con;
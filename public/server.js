var express =require('express');
var router=express.Router();
var bodyParser=require('body-parser');
var my_sql=require('./db_connection');
var session=require('express-session');
var passport=require('passport');
var LocalStrategy=require('passport-local');
var flash=require('connect-flash');
var fs=require('fs');
var ejs=require('ejs');
var app=express();

app.use(express.static('public'));
app.use(flash());
app.use(bodyParser.urlencoded({extended:true}));

router.use(bodyParser.urlencoded({extended:false}));

app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/login.html');
});
//로그인하기
passport.serializeUser(function(user,done){
    done(null,user.id)
});
passport.deserializeUser(function(id, done){
    my_sql.query('select * from person where id=?',[id],function(err,rows){
        var user=rows[0];
        done(err,user);
    })
});
passport.use(new LocalStrategy({usernameField:'id',passwordField:'password'},function(id,password,done){
   my_sql.query('select * from person where id=?',[id],function(err,rows){
       var user=rows[0];
       if(err){
           console.log(err);
           return done(err);
       }
       if(!user){
           return done(null, false,{message:'Incorrect id'});
        }
        if(user.password!==password){
            return done(null, false,{message:'Incorrect password'});
        }
        else{
            console.log(rows);
            return done(null, user);
        }
   });
}));
app.post('/data_login',function(req,res,next){
    passport.authenticate('local',function(err,body){
        if(err){
            console.log(err);
            return next(err);
        }
        if(!body)return res.redirect('/');
        req.logIn(body,function(err){
            if(err) return next(err);
            else
                return res.redirect('/main?token='+req.body.id);
        });
    })(req,res,next);
});

//로그인 첫 화면
app.get('/main',function(req,res){
    fs.readFile('main.html','utf-8',function(err,data){
        if(err){
            console.log("파일오류"+err);
            return;
        }
        else{   
            var sql="select * from post where user_id='"+req.query.token+"'";
            my_sql.query(sql,function(err,result){
                if(err)console.log("mysql"+err);
                else{
                    res.send(ejs.render(data,{
                            data:result
                        }));
                    }
            });  
        }
    });
});
app.get('/info',function(req,res){
    var sql="select * from post where user_id in(select follow from follower where user='"+req.query.token+"') or user_id in(select id from person where id='"+req.query.token+"') order by date desc ;";
    my_sql.query(sql,function(err,rows){
        if(err)console.log("mysql"+err);
        else{
            console.log(rows);
            res.send(rows);
            }
    }); 
});

//좋아요 클릭
app.get('/likely',function(req,res){
    console.log("insert-user : "+req.query.token,req.query.name,req.query.no);
    var sql='insert into plike values("'+req.query.token+'",'+req.query.no+',1,"'+req.query.name+'")';
    my_sql.query(sql, function(err,rows){
        if(err)console.log(err);
        else{
            res.send(rows);
        }
    });
});
app.get('/addlikely',function(req,res){
    var alter_sql="update post set likely=likely+1 where no="+req.query.no;
    my_sql.query(alter_sql,function(err,rows){
        if(err)console.log('addlikely'+err);
        else{
            console.log('addlikely');
            res.send(rows);
        }
    });
});

app.get('/dellikely',function(req,res){
    console.log("delete-user : "+req.query.token,req.query.name,req.query.no);
    var sql='delete from plike where user_id="'+req.query.token+'"and pnum='+req.query.no;
    my_sql.query(sql, function(err,rows){
        if(err)console.log(err);
        else{
            res.send(rows);
        }
    });
});
app.get('/-likely',function(req,res){
    var alter_sql="update post set likely=likely-1 where no="+req.query.no;
    my_sql.query(alter_sql,function(err,rows){
        if(err)console.log('-likely'+err);
        else{
            console.log('-likely');
            res.send(rows);
        }
    });
})

//해시태그 검색
app.get('/search',function(req,res){
    var serdata=[];
    var sear=req.query.ser;  //ser=name
    var sql=('select * from post where hashtag like binary("%'+sear+'%") order by date DESC');
    my_sql.query(sql, function(err,rows){
        serdata=rows;
        if(err)console.log('err',err);
        if(!err)res.send(serdata);
    });
    
});

app.get('/p',function(req,res){
    console.log(req.query.no);
})

app.listen(80, function(){
    console.log('example app listening on port 80');
});

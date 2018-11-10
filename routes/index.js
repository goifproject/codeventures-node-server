var express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const dbconfig = require('../config/database');
const conn = mysql.createConnection(dbconfig);

var router = express.Router();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
})
var upload = multer({ storage: storage });

/* GET home page. */
router.get('/api/users', function (req, res, next) {
  let sql = `select * from users`;
  conn.query(sql, (err, rows, fields) => {
    res.json(rows);
  });
});

router.get('/api/user/:user_idx', function (req, res, next) {
  let sql = `select * from users where user_idx = "${req.params.user_idx}"`;
  console.log(sql);
  conn.query(sql, (err, rows, fields) => {
    res.json(rows);
  });
});

router.get('/api/user/:email', function (req, res, next) {
  let sql = `select * from users where user_email = "${req.params.email}"`;
  console.log(sql);
  conn.query(sql, (err, rows, fields) => {
    res.json(rows);
  });
});

router.post('/test', upload.none(), function (req, res, next) {
  res.send('' + JSON.stringify(req.body.asdf));
});

router.post('/api/signup', function (req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  let name = req.body.name;
  let snum = req.body.snum;

  let coin = 1000;
  console.log(`${email},${password},${name},${snum}`);
  let sql = `INSERT INTO users (user_email,user_name,user_password,user_snum,user_coin) VALUES (?,?,PASSWORD(?),?,?)`;
  let params = [email, name, password, snum, coin];
  conn.query(sql, params, (err, rows, fields) => {
    let result = { "result": "success" }
    res.json(result);
  });
});

router.post('/api/signin', function (req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  let location = req.body.location;
  if (email != undefined && password != undefined) {
    // let result = `{"result":"success","email":${email} }`
    let result = {
      "result": "success",
      "email": email,
      "location": location
    }
    res.json(result);
  }
});

router.get('/api/auction', function (req, res, next) {
  let sql = `select 
  * 
  from auction`;

  conn.query(sql, (err, rows, fields) => {
    if (err) {
      res.json(err);
    }
    res.json(rows);
  });
});


router.post('/api/auction', function (req, res, next) {
  let price = req.body.price;
  let email = req.body.email;
  let status = req.body.status;
  let product_idx = req.body.product_idx

  let sql = `select user_idx,product_idx from users,product where user_email = "${email}" AND product_idx = "${product_idx}"`;
  conn.query(sql, (err, sel_rows, fields) => {
    sql = `INSERT INTO auction (auction_price,auction_date,auction_status,fk_user_idx,fk_product_idx)
       VALUES (?,NOW(),?,?,?)`;
    let params = [price, status, sel_rows[0].user_idx, sel_rows[0].product_idx];
    conn.query(sql,params,(err,ins_rows,fields)=>{
      let result = {
        "result" : "success"
      }
      res.json(result);
    })
  })
  // conn.query(sql,(err,rows,fields)=>{


  //let params = [price,status,rows[0].user_idx,rows[0].product_idx]
  // conn.query(sql,params,(err,rows,fields)=>{
  //   let result = {
  //     "result" : "success"
  //   }
  //   res.json(result);
  // })
  // })
});

router.get('/api/auction/:product_idx', function (req, res, next) {
  let product_idx = req.params.product_idx;
  let sql = `select MAX(auction_price) as price from auction where fk_product_idx = ${product_idx} limit 1`;
  let result;
  let maxPrice;
  conn.query(sql, (err, rows, fields) => {
    if (err) {
      res.json(err);
    }
    // res.json(rows)
    maxPrice = rows[0].price;

    let sql = `select * from auction where fk_product_idx = ${product_idx}`;
    conn.query(sql, (err, rows, fields) => {
      let auctions = rows
      result = { maxPrice, auctions }
      res.json(result);
    })

  });
});


router.get('/api/product/:product_idx', function (req, res, next) {
  let product_idx = req.params.product_idx;
  let sql = `SELECT * FROM product where product_idx = ${product_idx}`;

  conn.query(sql, (err, rows, fields) => {
    res.json(rows);
  });
});

router.get('/api/products', function (req, res, next) {
  let sql = `SELECT * FROM product`;
  conn.query(sql, (err, rows, fields) => {
    res.json(rows);
  });
});

router.post('/api/product', upload.single('image'), function (req, res, next) {
  let title = req.body.title;
  let content = req.body.content;
  let image, stime, etime;
  etime = req.body.etime;
  image = req.file.path;
  console.log(image);
  let sql = `INSERT INTO product (product_title,product_content,product_image,product_stime,product_etime) 
  VALUES (?,?,?,NOW(),date_ADD(NOW(), INTERVAL "${etime}" HOUR))`;
  let params = [title, content, image];

  conn.query(sql, params, (err, rows, fields) => {
    if (err) {
      console.log("디비에러" + err);
      res.json(err);
    }
    let result = {
      "result": "success"
    }
    res.json(result);
  });
});

module.exports = router;

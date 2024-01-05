const mysql = require('mysql2');
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const db = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'jainn0984@N',
    database:'assignment1'
})

// db.query('Select * from product',(res,err) => {
//     console.log(res);
//     console.log(err);
// })

app.get("/", (req, res) =>
  res.send(
    `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
  )
);

app.get('/person',(req,res) => {
    const {party_id} = req.body;
    if(!party_id){
        db.query('SELECT * FROM person',(err,result) => {
            if(err){
                console.log(err);
                res.status(500).json({error:"Internal Server Error"});
            }
            else{
                res.status(201).json({result});
            }
        })
    }
    else{
        db.query('SELECT * FROM person where party_id=?',party_id,(err,result) => {
            if(err){
                console.log(err);
                res.status(500).json({error:"Internal Server Error"});
            }
            else{
                res.status(201).json({result});
            }
        })
    }
})

app.post('/person',(req,res) => {
    const data = req.body;
    db.query('INSERT INTO person SET ?',data,(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            res.status(201).json({msg:"Data Inserted Successfully"});
        }
    })
})


app.post('/order',(req,res) => {

    let {
        order_name,
        placed_date,
        approved_date,
        status_id,
        party_id,
        currency_uom_id,
        product_store_id,
        sales_channel_enum_id,
        grand_total,
        completed_date} = req.body;
        console.log(req.body);
        if(!order_name || !placed_date){
            res.status(400).json({err:"OrderName and PlacedDate Required"})
        }
        if(!currency_uom_id){
            currency_uom_id="USD";
        }
        if(!status_id){
            status_id="OrderPlaced";
        }
        db.query('Select * from party where party_id = ?',[party_id],(err,result) => {
            if(err){
                res.status(500).json({err:"Internal Server Error"});
            }
            else{
                if(result.length===0){
                    res.status(404).json({msg:"No data found"});
                }
                const order_id = crypto.randomBytes(10).toString("hex");
                console.log(restToken);
                // const insertorder = `INSERT INTO order_header SET ?`;
                const insertorder = `INSERT INTO order_header (order_id,
                    order_name,
                    placed_date,
                    approved_date,
                    status_id,
                    party_id,
                    currency_uom_id,
                    product_store_id,
                    sales_channel_enum_id,
                    grand_total,
                    completed_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                const values = [
                    order_id,
                    order_name,
                    placed_date,
                    approved_date,
                    status_id,
                    party_id,
                    currency_uom_id,
                    product_store_id,
                    sales_channel_enum_id,
                    grand_total,
                    completed_date]
                db.query(insertorder,values,(err,result) => {
                    if(err){
                        console.log(err);
                        res.status(500).json({error:"Internal Server Error"});
                    }
                    else{
                        res.status(201).json({order_id});
                    }
                })
            }
        })
})

app.get('/order',(req,res) => {
    // db.query('SELECT * FROM order_header,order_item where order_header.order_id=order_item.order_id',(err,result) => {
        db.query(`SELECT *,(SELECT JSON_ARRAYAGG( JSON_OBJECT(
            'order_item_seq_id', oi.order_item_seq_id,
            'product_id', oi.product_id,
            'item_description', oi.item_description,
            'quantity', oi.quantity,
            'unit_amount', oi.unit_amount,
            'item_type_enum_id', oi.item_type_enum_id
        )
    )
FROM order_item oi
    WHERE
    oi.order_id = order_header.order_id
) AS order_items from order_header`,(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            res.status(201).json({result});
        }
    })
})

app.get('/order/:order_id',(req,res) => {
    const {order_id} = req.params;
    // db.query('SELECT * FROM order_item where order_id = ?',[order_id],(err,result) => {
    db.query(`SELECT *,(SELECT JSON_ARRAYAGG( JSON_OBJECT(
            'order_item_seq_id', oi.order_item_seq_id,
            'product_id', oi.product_id,
            'item_description', oi.item_description,
            'quantity', oi.quantity,
            'unit_amount', oi.unit_amount,
            'item_type_enum_id', oi.item_type_enum_id
        )
    )
FROM order_item oi
    WHERE
    oi.order_id = order_header.order_id
) AS order_items from order_header where order_id=?`,[order_id],(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            res.status(201).json({order_items:result});
        }
    })
})

app.post('/order/:order_id',(req,res) => {
    const {order_id} = req.params;
    let {
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id
    } = req.body;
    if(!order_item_seq_id || !product_id || !item_description || !quantity || !unit_amount || !item_type_enum_id){
        res.status.apply(400).json({msg:"Provide Complete Data"});
    }
    // const data = req.body;
    const insertorderitem = `INSERT INTO order_item (order_id,
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id) VALUES (?,?,?,?,?,?,?)`;
    const values = [
        order_id,
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id];
    db.query(insertorderitem,values,(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            res.status(201).json({order_id,order_item_seq_id});
        }
    })
})


app.put('/order/:order_id',(req,res) => {
    let {order_name} = req.body;
    const {order_id} = req.params;
    db.query('UPDATE order_header SET order_name = ? WHERE order_id = ?',[order_name,order_id],(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            db.query('SELECT * from order_header WHERE order_id = ?',[order_id],(err,result) => {
                if(err){
                    res.status(500).json({error:"Internal Server Error"});
                }
                else{
                    res.status(200).json({order_header:result});
                }
        })
    }
    })
})

app.listen(5050,()=>{
    console.log(`Server working on Port: 5050`);
})


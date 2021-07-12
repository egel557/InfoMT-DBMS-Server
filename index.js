"use strict"

const express = require("express")
const db = require("./config/db")
const cors = require("cors")

const app = express()
const PORT = 5000
app.use(cors())
app.use(express.json())


app.get("/main_records", (req, res) => {
    const { month="All", year="All", type } =  req.query
    const table = type === "electric" ? "electric_v" : type == "water" ? "water_v" : null
    
    if (!table) return res.send([])

    const period_end = year !== "All" ? (month !== "All" ? `${year}-${month}-%` : `${year}-%`) : "%"

    db.query(
        `SELECT * FROM ${table} WHERE Period_End LIKE ? ORDER BY Period_End DESC ;`, 
        [ period_end ],
        (err,result) => {
            if(err) console.log(err)
            res.send(result.map(row => {
                return {
                    ...row,
                    type
                }
            }))
        }
    )  
})

app.post("/main_records/new", (req, res) => {
    const { Bill_ID, Meter_No, Period_ID, Rate, Total_Amount, Previous, Current, Consumption } = req.body

//     EX:  INSERT INTO `bill_detail_t` VALUES ('E-100XX', '386XXX', '751', '12', '323232'); //Use the previous variables,
//                                    (`Bill_ID`, `Meter_No`, `Period_ID`, `Rate`, `Total_Amount`)


//     Ex:  INSERT INTO `m_reading_t`  VALUES ('E-100XX', '751', '1000', '1050.10', '50.10') //Use the previous variables,
//                                     (`Meter_No`, `Period_ID`, `Previous`, `Current`, `Consumption`)


    db.query(
        "INSERT INTO m_reading_t  VALUES (?, ?, ?, ?, ?)",
            [ Meter_No, Period_ID, Previous, Current, Consumption ],
        (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send()
            } 
            db.query(
                "INSERT INTO bill_detail_t VALUES (?, ?, ?, ?, ?)",
                [ Bill_ID, Meter_No, Period_ID, Rate, Total_Amount ],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send()
                    } 
                    res.send(result)
                }
            )
        }
    )
})


app.get("/tenants", (req, res) => {
    db.query(
        "SELECT * FROM tenants",
        (err, result) => {
            if(err) res.status(500).send(err)
            res.send(result.map(row => {
                return {
                    ...row,
                    Status: Boolean(row.Status)
                }
            }))
        }
    )
})

app.get("/type-tenants", (req, res) => {
    const { type } = req.query

    
    if (![ "water", "electric" ].includes(type)) res.status(500).send()

    const config = {
        electric: {
            table: "e_bill_t",
            id: "E_BILL_ID"
        },
        water: {
            table: "w_bill_t",
            id: "W_BILL_ID"
        }
    }
    
    db.query(
        `SELECT ${config[type].table}.${config[type].id}, tenant_t.Name FROM ${config[type].table} LEFT JOIN tenant_t ON ${config[type].table}.Tenant_ID = tenant_t.Tenant_ID`,
        (err, result) => {
            if (err) res.status(500).send()
            res.send(result)
        }
    )
})

app.post("/type-tenants/new", (req, res) => {
    const { type, Tenant_ID } = req.body

    if (![ "electric", "water" ].includes(type)) return res.status(500).send()

    const bill = {
        electric: {
            table: "e_bill_t",
            prefix: "E-",
            id: "E_Bill_ID"
        },
        water: {
            table: "w_bill_t",
            prefix: "W-",
            id: "W_Bill_ID"
        }
    }[type]

    db.query(
        `SELECT MAX(${bill.id}) as Prev_ID FROM ${bill.table}`,
        (err, result) => {
            if (err) {
                console.log(err)
                return res.status(500).send()
            }
            const Prev_ID = result[0].Prev_ID + ""
            const New_ID = bill.prefix + (Number(Prev_ID.replace(bill.prefix, "")) + 1)
            
            db.query(
                `INSERT INTO ${bill.table} VALUES (?, ?)`,
                [New_ID, Tenant_ID],
                (err, result) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send()
                    }
                    res.send(result)
                }
            )
        }
    )
})


app.get("/periods", (req, res) => {
    db.query(
        "SELECT Period_ID, Period_Start, Period_End FROM period_t ORDER BY Period_End DESC",
        (err, result) => {
            if (err) res.status(500).send()
            res.send(result)
        }
    )
})

app.post("/periods/new", (req, res) => {
    const { Period_Start, Period_End } = req.body
    db.query(
        "INSERT INTO period_t VALUES (NULL, ?, ?)",
        [ Period_Start, Period_End ],
        (err, result) => {
            if (err) res.status(500).send()
            res.send(result)
        }
    )
})

app.get("/tenant-meter-details", (req, res) => {
    const { Bill_ID } = req.query

    db.query(
        "SELECT Meter_No FROM bill_detail_t WHERE Bill_ID = ? GROUP BY Meter_No",
        [ Bill_ID ],
        (err, result) => {
            if (err) return res.status(500).send()
            if (result.length === 0) return res.status(404).send()

            const Meter_No = result.length > 0 && result[0].Meter_No
    
            
            db.query(
                "SELECT MAX(Current) as Previous FROM billing_db.m_reading_t WHERE Meter_No = ?",
                [Meter_No],
                (err, result) => {
                    if (err) return res.status(500).send()
                    res.send({
                        Meter_No,
                        ...result[0]
                    })
                }
            )
        }
    )
})


app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`)
})
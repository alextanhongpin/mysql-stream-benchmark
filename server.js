/*
 * setup.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 14/08/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/
const Transform = require('stream').Transform
const app = require('express')()
const faker = require('faker')
const prometheus = require('prom-client')
const collectDefaultMetrics = prometheus.collectDefaultMetrics
const Registry = prometheus.Registry
const register = new Registry()
const Promise = require('bluebird')
const fs = require('fs')

collectDefaultMetrics({ register })

// The amount of items you want to insert as bulk
const BULK = 100

const mysql = require('mysql')
const connection = mysql.createConnection({
  host: '192.168.8.102',
  user: 'root',
  password: '123456',
  database: 'demo'
})

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack)
    return
  }
  console.log('connected as id ' + connection.threadId)
})

function createAddress () {
  return {
    zipCode: faker.address.zipCode(),
    city: faker.address.city(),
    cityPrefix: faker.address.cityPrefix(),
    citySuffix: faker.address.citySuffix(),
    streetName: faker.address.streetName(),
    streetAddress: faker.address.streetAddress(),
    streetSuffix: faker.address.streetSuffix(),
    streetPrefix: faker.address.streetPrefix(),
    secondaryAddress: faker.address.secondaryAddress(),
    county: faker.address.county(),
    country: faker.address.country(),
    countryCode: faker.address.countryCode(),
    state: faker.address.state(),
    stateAbbr: faker.address.stateAbbr(),
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude()
  }
}
function insert () {
  return new Promise((resolve, reject) => {
    const address = createAddress()

    connection.query('INSERT INTO address SET ?', address, (error, results, fields) => {
      error ? resolve(null) : resolve(fields)
    })
  })
}

function bulkInsert () {
  return new Promise((resolve, reject) => {
    const addresses = Array(BULK).fill(0).map(() => {
      return Object.values(createAddress())
    })

    connection.query('INSERT INTO address (zipCode, city, cityPrefix, citySuffix, streetName, streetAddress, streetSuffix, streetPrefix, secondaryAddress, county, country, countryCode, state, stateAbbr, latitude, longitude) VALUES ?', [addresses], (error, results, fields) => {
      error ? resolve(null) : resolve(fields)
    })
  })
}

app.get('/insert', (req, res) => {
  const concurrency = 100
  const count = parseInt(req.query.count || 0, 10)

  const start = preciseTime()
  Promise.all(Array(count).fill(0)).map(() => {
    return insert()
  }, {
    concurrency
  }).then((done) => {
    // connection.end()
    fs.appendFile('data.txt', `${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
      if (err) {
        console.log(err)
      }
      res.status(200).json({
        count,
        message: 'success'
      })
    })
  }).catch((error) => {
    res.status(200).json({
      count,
      message: 'error'
    })
  })
})

app.get('/bulk-insert', (req, res) => {
  const concurrency = 300
  const count = parseInt(req.query.count || 0, 10) / BULK

  const start = preciseTime()
  const addresses = Array(count).fill(0)
  Promise.all(addresses)
  .map(bulkInsert, {
    concurrency
  }).then((done) => {
    // connection.end()
    fs.appendFile('data.txt', `${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
      if (err) {
        console.log(err)
      }
      res.status(200).json({
        count,
        message: 'success'
      })
    })
  }).catch((error) => {
    res.status(200).json({
      count,
      message: error.message
    })
  })
})
let rows = []
app.get('/addresses', (req, res) => {
  const concurrency = 0
  const count = req.query.count
  const start = preciseTime()
  const query = connection.query(`SELECT * FROM address LIMIT ${count}`)
  let i = 0

  const transform = new Transform({objectMode: true})
  transform._transform = (data, encoding, callback) => {
    rows.push(data)

    if (rows.length >= BULK) {
      i += 1
      const slices = rows.splice(0, BULK)

      const addresses = slices.map(Object.values)
      if (addresses.length) {
        connection.query('INSERT INTO address (zipCode, city, cityPrefix, citySuffix, streetName, streetAddress, streetSuffix, streetPrefix, secondaryAddress, county, country, countryCode, state, stateAbbr, latitude, longitude) VALUES ?', [addresses], (error, results, fields) => {
          if (error) {
            console.log(error)
          }
          console.log('indexed 100 data')
        })
      }
    }

    callback()
    // Single query
    // i++
    // connection.query('INSERT INTO address SET ?', data, (error, results, fields) => {
    //   console.log('count', i)
    // })
    // callback()
  }

  query
  .stream()
  .pipe(transform)
  .on('error', (err) => {
    if (err) {
      res.status(400).json({
        error: err.message
      })
    }
  })
  .on('finish', () => {
    console.log('i', i)
    // Might happen if the data has modulus remainder
    if (rows.length > 0) {
      const addresses = rows.map(Object.values)
      if (addresses.length) {
        connection.query('INSERT INTO address (zipCode, city, cityPrefix, citySuffix, streetName, streetAddress, streetSuffix, streetPrefix, secondaryAddress, county, country, countryCode, state, stateAbbr, latitude, longitude) VALUES ?', [addresses], (error, results, fields) => {
          if (error) {
            console.log(error)
          }
          fs.appendFile('data.txt', `read/write: ${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
            if (err) {
              console.log(err)
            }
            res.status(200).json({
              count,
              message: 'success'
            })
          })
        })
      }
    } else {
      fs.appendFile('data.txt', `read/write: ${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
        if (err) {
          console.log(err)
        }
        res.status(200).json({
          count,
          message: 'success'
        })
      })
    }
  })
})

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'ok'
  })
})
// Expose the collected metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})

app.listen(4000, () => {
  console.log('listening to port *:4000. press ctrl + c to cancel')
})

function preciseTime () {
  const hrTime = process.hrtime()
  return hrTime[0] * 1000000 + hrTime[1] / 1000
}

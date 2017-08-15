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
// const templatePlugin = require('prometheus-plugin-cpu-stats')
const Promise = require('bluebird')
const fs = require('fs')
// Enable collection of default metrics
collectDefaultMetrics({ register })

// start metrics collection
// templatePlugin.init().start()

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
  console.log('count', count)
  console.log('concurrency', concurrency)
  console.time('time taken to index')
  const start = preciseTime()
  Promise.all(Array(count).fill(0)).map(() => {
    return insert()
  }, {
    concurrency
  }).then((done) => {
    console.log('done')
    console.timeEnd('time taken to index')
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
    console.log('error inserting', error)

    res.status(200).json({
      count,
      message: 'error'
    })
  })
})

app.get('/bulk-insert', (req, res) => {
  const concurrency = 300
  const count = parseInt(req.query.count || 0, 10) / BULK
  console.log('count', count)
  console.log('concurrency', concurrency)

  const start = preciseTime()
  console.time('time taken to index')
  const addresses = Array(count).fill(0)
  Promise.all(addresses)
  .map(bulkInsert, {
    concurrency
  }).then((done) => {
    console.log('done')
    console.timeEnd('time taken to index')
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
    console.log('error inserting', error)

    res.status(200).json({
      count,
      message: 'error'
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
      // do something with data...
    rows.push(data)

    if (rows.length >= 100) {
      i += 1
      const firstTen = rows.splice(0, 100)

      console.log('slicing first 100', firstTen.length, rows.length)
      const addresses = firstTen.map(Object.values)
      console.log(addresses[0])
      console.log('performing query')

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
      console.log('error hit', err)
      // res.status(400).json({
      //   error: err.message
      // })
    }
    // Handle error, an 'end' event will be emitted after this as well
  })

  .on('finish', () => {
    // all rows have been received
    console.log('i=', i, rows.length)
    if (rows.length) {
      connection.query('INSERT INTO address (zipCode, city, cityPrefix, citySuffix, streetName, streetAddress, streetSuffix, streetPrefix, secondaryAddress, county, country, countryCode, state, stateAbbr, latitude, longitude) VALUES ?', [rows.map(Object.values)], (error, results, fields) => {
        if (error) {
          console.log('error', error)
        }
        console.log('indexed 100 data')
        fs.appendFile('data.txt', `${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
          if (err) {
            console.log(err)
          }
          res.status(200).json({
            count,
            message: 'success'
          })
        })
      })
    } else {
      fs.appendFile('data.txt', `${concurrency}, ${count}, ${preciseTime() - start}\n`, (err) => {
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

/*
 * setup.js
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Created by Alex Tan Hong Pin 14/08/2017
 * Copyright (c) 2017 alextanhongpin. All rights reserved.
**/
const app = require('express')()
const faker = require('faker')
const prometheus = require('prom-client')
const collectDefaultMetrics = prometheus.collectDefaultMetrics
const Registry = prometheus.Registry
const register = new Registry()
const Promise = require('bluebird')
// Enable collection of default metrics
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

function insert () {
  return new Promise((resolve, reject) => {
    const address = {
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

    connection.query('INSERT INTO address SET ?', address, (error, results, fields) => {
      error ? resolve(null) : resolve(fields)
    })
  })
}

function bulkInsert () {
  return new Promise((resolve, reject) => {
    const addresses = Array(BULK).fill({
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
    }).map((obj) => {
      return Object.values(obj)
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
  Promise.all(Array(count).fill(0)).map(() => {
    return insert()
  }, {
    concurrency
  }).then((done) => {
    console.log('done')
    console.timeEnd('time taken to index')
    // connection.end()
    res.status(200).json({
      count,
      message: 'success'
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
  console.time('time taken to index')
  Promise.all(Array(count).fill(0)).map(() => {
    return bulkInsert()
  }, {
    concurrency
  }).then((done) => {
    console.log('done')
    console.timeEnd('time taken to index')
    // connection.end()
    res.status(200).json({
      count,
      message: 'success'
    })
  }).catch((error) => {
    console.log('error inserting', error)

    res.status(200).json({
      count,
      message: 'error'
    })
  })
})

// query
//   .on('error',  (err) => {
//     // Handle error, an 'end' event will be emitted after this as well
//   })
//   .on('fields',  (fields) => {
//     // the field packets for the rows to follow
//   })
//   .on('result',  (row) => {
//     // // Pausing the connnection is useful if your processing involves I/O
//     // connection.pause()

//     // processRow(row, function () {
//     //   connection.resume()
//     // })
//   })
//   .on('end',  () => {
//     // all rows have been received
//   })

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

import si from '../../dist/search-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'BUCKETFILTER'

test('create a search index', t => {
  t.plan(1)
  si({ name: indexName }).then(db => {
    global[indexName] = db    
    t.pass('ok')
  })
})

test('can add data', t => {
  const data = [
    {
      "_id": 0,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 1,
      "make": "BMW",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 2,
      "make": "Tesla",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 3,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "BMW"
    },
    {
      "_id": 4,
      "make": "Volvo",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 5,
      "make": "Volvo",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 6,
      "make": "Tesla",
      "manufacturer": "Tesla",
      "brand": "BMW"
    },
    {
      "_id": 7,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Tesla"
    },
    {
      "_id": 8,
      "make": "Volvo",
      "manufacturer": "BMW",
      "brand": "Tesla"
    },
    {
      "_id": 9,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    }
  ]

  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('simple BUCKETFILTER (Promise.all)', t => {
  const { GET, BUCKET, BUCKETFILTER } = global[indexName]
  t.plan(1)
  BUCKETFILTER(
    Promise.all([
      BUCKET({
        FIELD: 'make',
        VALUE: {
          GTE: 'a',
          LTE: 'u'
        }
      })
    ]),
    GET('make:bmw') // TODO: this should be able to be just 'make:bmw'
  ).then(res => {
    t.deepEqual(res, [
      {
        FIELD: [ 'make' ], VALUE: { GTE: 'a', LTE: 'u' }, _id: [ '1', '7', '9' ] 
      }
    ])
  })
})

test('simple BUCKETFILTER', t => {
  const { GET, BUCKET, BUCKETFILTER } = global[indexName]
  t.plan(1)
  BUCKETFILTER(
    [
      BUCKET({
        FIELD: 'make',
        VALUE: {
          GTE: 'a',
          LTE: 'u'
        }
      })
    ],
    GET('make:bmw') // TODO: this should be able to be just 'make:bmw'
  ).then(res => {
    t.deepEqual(res, [
      {
        FIELD: [ 'make' ], VALUE: { GTE: 'a', LTE: 'u' }, _id: [ '1', '7', '9' ] 
      }
    ])
  })
})

test('simple BUCKETFILTER (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: [{
        FIELD: 'make',
        VALUE: {
          GTE: 'a',
          LTE: 'u'
        }
      }],
      FILTER: { GET: 'make:bmw'}
    }
  }).then(res => {
    t.deepEqual(res, [
      {
        FIELD: [ 'make' ], VALUE: { GTE: 'a', LTE: 'u' }, _id: [ '1', '7', '9' ] 
      }
    ])
  })
})

test('simple BUCKETFILTER (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: [{
        FIELD: 'make',
        VALUE: {
          GTE: 'a',
          LTE: 'u'
        }
      }],
      FILTER: { AND: [ 'make:bmw', 'manufacturer:tesla' ]}
    }
  }).then(res => {
    t.deepEqual(res, [
      {
        FIELD: [ 'make' ], VALUE: { GTE: 'a', LTE: 'u' }, _id: [ '7', '9' ] 
      }
    ])
  })
})

test('simple BUCKETFILTER (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: [{
        FIELD: 'make',
        VALUE: {
          GTE: 'a',
          LTE: 'u'
        }
      }],
      FILTER: { OR: [ 'brand:tesla', 'manufacturer:tesla' ]}
    }
  }).then(res => {
    t.deepEqual(res, [
      {
        FIELD: [ 'make' ], VALUE: { GTE: 'a', LTE: 'u' }, _id: [ '2', '6', '7', '9' ] 
      }
    ])
  })
})

test('simple BUCKETFILTER, using DICTIONARY', t => {
  const { BUCKET, GET, DICTIONARY, BUCKETFILTER } = global[indexName]
  t.plan(1)
  BUCKETFILTER(
    DICTIONARY({
      FIELD: ['make'],
      VALUE: {
        GTE: 'a',
        LTE: 'u'
      }
    }).then(dict => dict.map(item => 'make:' + item))
      .then(dict => dict.map(BUCKET)),
    GET('make:bmw') // TODO: this should be able to be just 'make:bmw'
  ).then(res => {
    t.deepEqual(res, [
      { FIELD: [ 'make' ], VALUE: { GTE: 'bmw', LTE: 'bmw' }, _id: [ '1', '7', '9' ] },
      { FIELD: [ 'make' ], VALUE: { GTE: 'tesla', LTE: 'tesla' }, _id: [] }
    ])
  })
})

test('simple BUCKETFILTER, using DISTINCT', t => {
  const { BUCKET, GET, DISTINCT, BUCKETFILTER } = global[indexName]
  t.plan(1)
  BUCKETFILTER(
    DISTINCT({
      FIELD: 'make',
      VALUE: {
        GTE: 'a',
        LTE: 'u'
      }
    }).then(dict => dict.map(BUCKET)),
    GET('make:bmw') // TODO: this should be able to be just 'make:bmw'
  ).then(res => {
    t.deepEqual(res, [
      { FIELD: [ 'make' ], VALUE: { GTE: 'bmw', LTE: 'bmw' }, _id: [ '1', '7', '9' ] },
      { FIELD: [ 'make' ], VALUE: { GTE: 'tesla', LTE: 'tesla' }, _id: [] }
    ])
  })
})

test('simple BUCKETFILTER, using DISTINCT (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: {
        DISTINCT: {
          FIELD: 'make',
          VALUE: {
            GTE: 'a',
            LTE: 'u'
          }
        }
      },
      FILTER: {
        GET: {
          FIELD: [ 'make' ],
          VALUE: {
            GTE: 'a',
            LTE: 'c'
          }
        }
      }
    }
  }).then(res => {
    t.deepEqual(res, [
      { FIELD: [ 'make' ], VALUE: { GTE: 'bmw', LTE: 'bmw' }, _id: [ '1', '7', '9' ] },
      { FIELD: [ 'make' ], VALUE: { GTE: 'tesla', LTE: 'tesla' }, _id: [] }      
    ])
  })
})


test('simple BUCKETFILTER, using DISTINCT (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: {
        DISTINCT: {
          FIELD: 'make',
          VALUE: {
            GTE: 'a',
            LTE: 'u'
          }
        }
      },
      FILTER: {
        GET: {
          FIELD: 'make',
          VALUE: 'bmw'
        }
      }
    }
  }).then(res => {
    t.deepEqual(res, [
      { FIELD: [ 'make' ], VALUE: { GTE: 'bmw', LTE: 'bmw' }, _id: [ '1', '7', '9' ] },
      { FIELD: [ 'make' ], VALUE: { GTE: 'tesla', LTE: 'tesla' }, _id: [] }      
    ])
  })
})

test('simple BUCKETFILTER, using DISTINCT (JSON)', t => {
  const { QUERY } = global[indexName]
  t.plan(1)
  QUERY({
    BUCKETFILTER: {
      BUCKETS: {
        DISTINCT: {
          FIELD: 'make',
          VALUE: {
            GTE: 'a',
            LTE: 'u'
          }
        }
      },
      FILTER: {
        GET: 'make:bmw'
      }
    }
  }).then(res => {
    t.deepEqual(res, [
      { FIELD: [ 'make' ], VALUE: { GTE: 'bmw', LTE: 'bmw' }, _id: [ '1', '7', '9' ] },
      { FIELD: [ 'make' ], VALUE: { GTE: 'tesla', LTE: 'tesla' }, _id: [] }      
    ])
  })
})

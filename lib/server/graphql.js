const bodyParser = require('koa-bodyparser')
const Router = require('koa-router')
const { makeExecutableSchema } = require('graphql-tools')
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa')

const router = new Router()

const groups = [
  {
    id: 1,
    name: 'Default',
    repeating: false
  },
  {
    id: 2,
    name: 'Offices',
    repeating: true
  },
];

const typeDefs = `
  type Group {
    id: ID!
    name: String!
    repeating: Boolean
  }

  type Query {
    allGroups: [Group!]!
  }
`

const resolvers = {
  Query: {
    allGroups: () => groups
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

router.post('/graphql', bodyParser(), graphqlKoa({ schema: schema }))
router.get('/graphql', graphiqlKoa({ endpointURL: '/graphql' }))

module.exports = router

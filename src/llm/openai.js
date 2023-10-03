const openai = require('openai')

const client = new openai.OpenAIApi({
  basePath: process.env.OPENAI_BASEURL,
  baseOptions: {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_TOKEN}`
    }
  }
})

module.exports = client

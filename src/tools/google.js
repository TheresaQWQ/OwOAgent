const cycletls = require('cycletls').default

const config = {
  ja3: '772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-0-17513-10-27-16-23-18-35-13-51-65281-43-5-11,29-23-24,0',
  headers: { 
    'X-API-KEY': process.env.TOOLS_SERPER_TOKEN, 
    'Content-Type': 'application/json'
  }
}

const search = async (args) => {
  const client = await cycletls()

  const resp = await client.post('https://google.serper.dev/search', {
    body: JSON.stringify(args),
    ...config
  })

  return resp.body
}

module.exports = {
  id: "google",
  desc: "search anything on google",
  args: [{
    name: "query",
    desc: "the query to search",
    type: "STRING",
    required: true
  }],
  run: async (args) => {
    const q = args.query;
    const requestArgs = { q, gl: "cn", hl: "zh-cn" }
    const data = await search(requestArgs)

    const knowledgeGraph = data.knowledgeGraph
    const organic = data.organic

    const result = []

    if (knowledgeGraph) {
      result.push(`**Knowledge Graph with type: ${knowledgeGraph.type}**`)
      result.push(`title: ${knowledgeGraph.title}`)
      result.push(`description: ${knowledgeGraph.description}`)
      result.push(`url: ${knowledgeGraph.descriptionLink}`)
      result.push(`attrs: ${knowledgeGraph.attrs.map(attr => `${attr.name} -> ${attr.value}`).join(", ")}`)
      result.push('\n\n')
    }

    if (organic) {
      result.push(`**Search Results**`)
      result.push(organic.map((item, index) => `${index + 1}. ${item.title}\nsnippet: ${item.snippet}\nurl: ${item.link}`).join("\n\n"))
    }

    return result.join("\n")
  }
}
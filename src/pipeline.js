const openai = require('./llm/openai')
const tools_google = require('./tools/google')
const tools_webpage = require('./tools/webpage')
const tools_sanbox = require('./tools/sanbox')

const tools = [
  tools_google,
  tools_webpage,
  tools_sanbox
]

let history = []

const ToolsPrompt = [
  `Now all your replies must be in the json format like {"action":"","target":"","args":{"arg1":"val1"}} , the "action" parameter can be "tools" or "finish"`,
  `"tools" means that you need to use the tools (I will tell you the specific list of tools later), and "finish" means that you have completed this task with result`,
  `The "target" parameter represents the "id" of the tool you need to use, and the "args" parameter represents the parameters you need to pass to the tool. The format is {"parameter name": "parameter value", "parameter name": "parameter value" }`,
  `After using the tool, the system will immediately tell you the return value of the tool, and you can decide the next action according to the return value`,
  `Among them, the "args" parameter of "finish" is {"message": "The message you need to reply to"}, in this cases, you can leave blank the parameters like "target"`,
  `Remember, you must reply in json format, and message must in Chinese`,
  '**Tools**',
  ...tools.map((tool, index) => {
    return `${index + 1}. id: ${tool.id}, desc: ${tool.desc}, args: ${tool.args.map(arg => `${arg.name}(type: ${arg.type} | required: ${arg.required} | desc: ${arg.desc})`).join(", ")}`
  })
].join('\n')

const chat = async (input) => {
  history.push({
    role: 'user',
    content: input
  })

  history = history.slice(-30)

  let finished = false
  let count = 0

  while (!finished) {
    if (count > 8) {
      history.push({
        role: 'system',
        content: 'You have reached the maximum number of rounds of thinking, and the system will automatically exit'
      })
      finished = true
      break
    }

    const chat = await openai.createChatCompletion({
      messages: [
        {
          role: 'system',
          content: `${ToolsPrompt}\n\nYou can only think about 8 rounds of questions, this is the ${count} round\n\nCurrent Date: ${new Date().toLocaleDateString()}, Current Time: ${new Date().toLocaleTimeString()}, Current Timezone: UTC+8`
        },
        ...history
      ],
      model: 'gpt-3.5-turbo-16k-0613',
      max_tokens: 4096
    })

    count++

    history.push(chat.data.choices[0].message)

    try {
      const chatResult = JSON.parse(chat.data.choices[0].message.content)
      const action = chatResult.action
      const target = chatResult.target
      const args = chatResult.args

      if (action === 'tools') {
        const tool = tools.find(tool => tool.id === target)

        console.log(require('./lib/time')() + `System[${count}] > `.blue + `Calling tool ${tool.id} with args ${JSON.stringify(args)}`)

        try {
          const result = await tool.run(args)
          history.push({
            role: 'system',
            content: result
          })

          console.log(require('./lib/time')() + `System[${count}] > `.blue + `Call tool ${tool.id} successfully`)
        } catch (err) {
          history.push({
            role: 'system',
            content: `Failed to call tool ${tool.id}, error: ${err.message}`
          })
          console.log(require('./lib/time')() + `System[${count}] > `.blue + `Call tool ${tool.id} failed`)
        }
      } else if (action === 'chat') {
        const message = args.message
        if (message) console.log(require('./lib/time')() + 'Bot > '.yellow + `${message.includes('\n') ? '\n' : ''}${message}`)
      } else if (action === 'finish') {
        finished = true
        const message = args.message
        if (message) console.log(require('./lib/time')() + 'Bot > '.yellow + `${message.includes('\n') ? '\n' : ''}${message}`)
      }
    } catch (error) {
      history.push({
        role: 'system',
        content: `Error: ${error.message}`
      })
    }
  }
}

module.exports = chat

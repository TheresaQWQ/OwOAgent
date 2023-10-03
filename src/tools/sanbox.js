const mathjs = require("mathjs");
const vm = require("vm");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  id: "vm",
  desc: [
    'you can write javascript code here and run it to compelte your task, you must return the result in the variable result.',
    'you can use the lib object to access the libraries, the lib object contains: mathjs, axios, fs',
    `mathjs: Calculate the result of a math expression, axios: Send a http request, fs: Read and write files like nodejs fs module`,
  ].join(''),
  args: [{
    name: "code",
    desc: "the code to run",
    type: "STRING",
    required: true
  }],
  run: async (args) => {
    const ctx = {
      lib: {
        mathjs: mathjs,
        axios: axios,
        fs: fs
      },
      result: null
    }

    const code = args.code;
    const script = new vm.Script(code);
    const context = vm.createContext(ctx);

    script.runInContext(context);

    return ctx.result || 'no result';
  }
}

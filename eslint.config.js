const neostandard = require('neostandard')
const { plugins } = neostandard

module.exports = [
  ...neostandard({
    env: ['browser']
  }),
  {
    plugins: {
      '@stylistic': plugins['@stylistic']
    },
    rules: {
      'no-console': 'warn',
      'no-use-before-define': 'warn',
      '@stylistic/spaced-comment': 'warn'
    }
  }
]

import permDirective from '../directives/perm'
import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
  app.use(permDirective)
})

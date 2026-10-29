import { boot } from 'quasar/wrappers'
import Print from 'vue3-print-nb'

export default boot(({ app }) => {
  app.use(Print)
})

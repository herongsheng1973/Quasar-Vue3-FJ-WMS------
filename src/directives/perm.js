import { useUserStore } from '../stores/userStore'

export default function (app) {
  app.directive('perm', {
    mounted(el, binding) {
      const store = useUserStore()
      const code = binding.value
      if (!store.permissions.includes(code)) {
        el.style.display = 'none'
      }
    },
  })
}

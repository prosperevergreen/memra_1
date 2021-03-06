import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import Vuelidate from 'vuelidate'
import Animate from 'animate.css'
import axios from 'axios'

Vue.use(Vuelidate)
Vue.use(Animate)

router.beforeEach((to, from, next)=>{
   const canLogin = store.getters.canLogin ? true : (localStorage.getItem('canLogin') == 'true' ? true: false)
  if(!canLogin && (to.path != '/' && to.path != "/login" && to.path != '/signup')){
    next('/')
  }else{
    next()
  }
})

Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

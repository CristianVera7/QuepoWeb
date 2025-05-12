import axios, { AxiosError } from 'axios'
import { defineStore } from 'pinia'
interface IStore {
    emailStore: string
    isRegistered: boolean
    tokenStore: string
    isLogged: boolean
    hasDni: boolean
}

export const useRegisterStore = defineStore('registerUser', {
    state: (): IStore => {
        return {
            emailStore: '',
            isRegistered: false,
            tokenStore: '',
            isLogged: false,
            hasDni: false
        }
    },

    getters: {
        hasRegisteredLocalStorage(): boolean {
            this.emailStore = localStorage.getItem('User registered')?.replace(/"/g, '') || ''
            return !!this.emailStore
        },
        hasTokenLocalStorage(): boolean {
            this.tokenStore = localStorage.getItem('User loged') || ''
            return !!this.tokenStore
        },
    },

    actions: {
        cleanStore() {
            this.emailStore = ''
            this.isRegistered = false
            this.tokenStore = ''
            this.isLogged = false
            this.hasDni = false
        },
        cleanStorage() {
            localStorage.removeItem('User loged')
            localStorage.removeItem('User registered')
        },
        setMailStore(email: string) {
            this.emailStore = email
            localStorage.setItem('User registered', JSON.stringify(email))
        },
        setisRegisteredStore(value: boolean) {
            this.isRegistered = value
        },
        setDniStore(value: boolean) {
            this.hasDni = value
        },
        updateSession(email: string, token: string) {
            this.emailStore = email
            this.tokenStore = token
            this.isLogged = true
            localStorage.setItem('User registered', JSON.stringify(email))
            localStorage.setItem('User loged', token)
        },
        async checkUser() {
            try {
                if (!this.hasRegisteredLocalStorage) {
                    this.cleanStorage()
                    return
                }

                const params = { email: this.emailStore }
                const URI = 'http://localhost:8000'
                const response = await axios.post(`${URI}/user/find`, params)
                if (!response.data.ok) {
                    console.log(`POR ALGUN MOTIVO, el usuario NO EXISTE YA EN LA BD`)
                    this.cleanStorage()
                    this.cleanStore()
                    return
                }
                this.isRegistered = true

                await this.checkToken()
                await this.checkHasDni()

            } catch (error) {
                console.log(error)
            }
        },
        async checkToken() {
            try {
                if (!this.hasTokenLocalStorage) {
                    this.isLogged = false
                    return
                }
                const URI = 'http://localhost:8000'
                const tokenHeader = { Authorization: 'Bearer ' + this.tokenStore }
                const response = await axios.get(`${URI}/isLoged`, { headers: tokenHeader })

                if (!response.data.ok) {
                    console.log(`Su token ha expirado, o ha sido modificado`)
                    localStorage.removeItem('User loged')
                    this.tokenStore = ''
                    this.isLogged = false
                    return
                }

                if (response.data.email && response.data.email !== this.emailStore) {
                    this.setMailStore(response.data.email)
                }

                this.isLogged = true
                return true
            } catch (error) {
                console.log(error)
            }
        },
        async checkHasDni() {
            if (!this.tokenStore) {
                return
            }
            try {
                const response = await axios.get(`http://localhost:8000/user/hasDni`, {
                    headers: {
                        Authorization: 'Bearer ' + this.tokenStore
                    }
                })


                if (response.data.hasDni === true) {
                    this.setDniStore(true)
                } else {
                    this.setDniStore(false)
                }
            } catch (error) {
                console.log(error)
            }
        },
    }
})
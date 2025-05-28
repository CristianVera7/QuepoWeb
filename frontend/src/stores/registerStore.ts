// Importación de Axios para hacer peticiones HTTP y tipos para manejo de errores
import axios, { AxiosError } from 'axios'
// Importación de Pinia para definir un store global
import { defineStore } from 'pinia'

// Interfaz que define la estructura del estado del store
interface IStore {
    emailStore: string
    isRegistered: boolean
    tokenStore: string
    isLogged: boolean
    hasDni: boolean
}

// Definición del store llamado 'registerUser'
export const useRegisterStore = defineStore('registerUser', {
    
    // Estado inicial del store
    state: (): IStore => {
        return {
            emailStore: '',        // Email del usuario registrado
            isRegistered: false,  // Indica si el usuario está registrado
            tokenStore: '',       // Token JWT del usuario
            isLogged: false,      // Indica si el usuario tiene sesión iniciada
            hasDni: false         // Indica si el usuario ha registrado su DNI
        }
    },

    // Getters para obtener datos derivados del estado
    getters: {
        // Verifica si hay un email registrado en localStorage
        hasRegisteredLocalStorage(): boolean {
            this.emailStore = localStorage.getItem('User registered')?.replace(/"/g, '') || ''
            return !!this.emailStore
        },
        // Verifica si hay un token guardado en localStorage
        hasTokenLocalStorage(): boolean {
            this.tokenStore = localStorage.getItem('User loged') || ''
            return !!this.tokenStore
        },
    },

    // Acciones que modifican el estado o realizan operaciones asíncronas
    actions: {
        // Limpia todo el estado del store
        cleanStore() {
            this.emailStore = ''
            this.isRegistered = false
            this.tokenStore = ''
            this.isLogged = false
            this.hasDni = false
        },
        // Elimina los datos guardados en localStorage
        cleanStorage() {
            localStorage.removeItem('User loged')
            localStorage.removeItem('User registered')
        },
        // Guarda el email en el store y en localStorage
        setMailStore(email: string) {
            this.emailStore = email
            localStorage.setItem('User registered', JSON.stringify(email))
        },
        // Cambia el estado de isRegistered
        setisRegisteredStore(value: boolean) {
            this.isRegistered = value
        },
        // Cambia el estado de hasDni
        setDniStore(value: boolean) {
            this.hasDni = value
        },
        // Actualiza sesión en store y localStorage con email y token
        updateSession(email: string, token: string) {
            this.emailStore = email
            this.tokenStore = token
            this.isLogged = true
            localStorage.setItem('User registered', JSON.stringify(email))
            localStorage.setItem('User loged', token)
        },
        // Verifica si el usuario existe en la base de datos y actualiza el estado
        async checkUser() {
            try {
                // Si no hay email guardado, limpia todo
                if (!this.hasRegisteredLocalStorage) {
                    this.cleanStorage()
                    return
                }

                const params = { email: this.emailStore }
                const URI = 'http://localhost:8000'
                const response = await axios.post(`${URI}/user/find`, params)

                // Si el usuario no existe, limpia todo
                if (!response.data.ok) {
                    console.log(`POR ALGUN MOTIVO, el usuario NO EXISTE YA EN LA BD`)
                    this.cleanStorage()
                    this.cleanStore()
                    return
                }

                this.isRegistered = true

                // Verifica el token y si tiene DNI
                await this.checkToken()
                await this.checkHasDni()

            } catch (error) {
                console.log(error)
            }
        },
        // Verifica si el token guardado es válido
        async checkToken() {
            try {
                if (!this.hasTokenLocalStorage) {
                    this.isLogged = false
                    return
                }

                const URI = 'http://localhost:8000'
                const tokenHeader = { Authorization: 'Bearer ' + this.tokenStore }
                const response = await axios.get(`${URI}/isLoged`, { headers: tokenHeader })

                // Si el token no es válido, lo elimina y actualiza estado
                if (!response.data.ok) {
                    console.log(`Su token ha expirado, o ha sido modificado`)
                    localStorage.removeItem('User loged')
                    this.tokenStore = ''
                    this.isLogged = false
                    return
                }

                // Si el email en el token es diferente al actual, lo actualiza
                if (response.data.email && response.data.email !== this.emailStore) {
                    this.setMailStore(response.data.email)
                }

                this.isLogged = true
                return true
            } catch (error) {
                console.log(error)
            }
        },
        // Verifica si el usuario ha registrado su DNI
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

                // Actualiza el estado hasDni según la respuesta del backend
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
